const config = require('../../config/config');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Op } = require('sequelize');
const Role = require('../../config/role');
const { serializeUserForClient } = require('../Utils/module-access');
const { mailHandler } = require('../../config/mail');
const zeptoMailService = require('./zeptomail.service');
const notificationService = require('./notification.service');
const { User, UserModuleAccess, UserSecurity, PasswordResetToken } = require('../Models');

class AuthService {
    async register(params) {
        const email = String(params.email || '').trim().toLowerCase();
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            throw 'This email is already registered!';
        }

        const user = new User({ ...params, email });
        const isFirstUser = (await User.count()) === 0;
        user.role = isFirstUser ? Role.Admin : Role.User;
        user.password = await hash(params.password);
        await user.save();

        if (!isFirstUser) {
            await notificationService.safeCreateForAdmins({
                title: 'New User Awaiting Approval',
                message: `${user.name} (${user.email}) registered and is waiting for approval.`,
                category: 'warning',
                eventType: 'user_registered',
                link: '/users',
                metadata: {
                    userId: user.id,
                    email: user.email,
                    status: user.status
                }
            });
        }
    }

    async authenticate({ email, password }) {
        const normalizedEmail = String(email || '').trim().toLowerCase();
        const user = await User.scope('withHash').findOne({
            where: { email: normalizedEmail },
            include: [
                {
                    model: UserModuleAccess,
                    as: 'moduleAccess',
                    required: false
                },
                {
                    model: UserSecurity,
                    as: 'security',
                    required: false
                }
            ]
        });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            throw 'Email or password is incorrect';
        }

        if (user.status !== 'verified') {
            throw `
            Please contact admin to get verified.
            Email: md@fazzaventures.com
            Phone: +971507021102
        `;
        }

        const jwtToken = generateJwtToken(user);
        const serializedUser = serializeUserForClient(user);

        return {
            user: serializedUser,
            requiresPasswordChange: Boolean(serializedUser.requiresPasswordChange),
            jwtToken
        };
    }

    async forcePasswordReset({ userId, currentPassword, newPassword }) {
        const user = await User.scope('withHash').findByPk(userId, {
            include: [
                {
                    model: UserSecurity,
                    as: 'security',
                    required: false
                },
                {
                    model: UserModuleAccess,
                    as: 'moduleAccess',
                    required: false
                }
            ]
        });

        if (!user) throw 'User not found';
        if (!(await bcrypt.compare(currentPassword, user.password))) {
            throw 'Current password is incorrect';
        }

        user.password = await hash(newPassword);
        await user.save();

        if (user.security) {
            await user.security.update({ mustChangePassword: false });
        } else {
            await UserSecurity.create({ UserId: user.id, mustChangePassword: false });
        }

        const updatedUser = await User.findByPk(user.id, {
            include: [
                {
                    model: UserSecurity,
                    as: 'security',
                    required: false
                },
                {
                    model: UserModuleAccess,
                    as: 'moduleAccess',
                    required: false
                }
            ]
        });

        return serializeUserForClient(updatedUser);
    }

    async requestPasswordReset({ email, originIp }) {
        const normalizedEmail = String(email || '').trim().toLowerCase();
        const genericResponse = {
            message: 'If that email exists, a reset link has been sent.'
        };

        const user = await User.findOne({ where: { email: normalizedEmail } });
        if (!user) return genericResponse;

        const now = new Date();
        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = hashResetToken(rawToken);
        const expiresAt = new Date(now.getTime() + 60 * 60 * 1000);

        await PasswordResetToken.update(
            { usedAt: now },
            {
                where: {
                    UserId: user.id,
                    usedAt: null,
                    expiresAt: {
                        [Op.gt]: now
                    }
                }
            }
        );

        await PasswordResetToken.create({
            UserId: user.id,
            tokenHash,
            expiresAt,
            createdByIp: originIp || null
        });

        const resetBaseUrl = process.env.PASSWORD_RESET_URL || 'http://localhost:3001/reset-password';
        const resetUrl = `${resetBaseUrl}?token=${encodeURIComponent(rawToken)}`;

        let emailSent = false;

        if (zeptoMailService.isConfigured()) {
            try {
                await zeptoMailService.sendPasswordResetEmail({
                    toEmail: user.email,
                    toName: user.name,
                    resetUrl
                });
                emailSent = true;
            } catch (error) {
                console.error('ZeptoMail password reset email failed:', error?.message || error);
            }
        }

        if (!emailSent) {
            try {
                await mailHandler(resetUrl, 'reset', 'Reset your Mafaza account password', user.email, user.name);
                emailSent = true;
            } catch (error) {
                console.error('SMTP password reset email failed:', error?.message || error);
            }
        }

        return genericResponse;
    }

    async resetPassword({ token, newPassword, originIp }) {
        const rawToken = String(token || '').trim();
        if (!rawToken) throw 'Invalid or expired reset link';

        const now = new Date();
        const tokenHash = hashResetToken(rawToken);
        const resetToken = await PasswordResetToken.findOne({
            where: {
                tokenHash,
                usedAt: null,
                expiresAt: {
                    [Op.gt]: now
                }
            }
        });

        if (!resetToken) throw 'Invalid or expired reset link';

        const user = await User.scope('withHash').findByPk(resetToken.UserId, {
            include: [
                {
                    model: UserSecurity,
                    as: 'security',
                    required: false
                },
                {
                    model: UserModuleAccess,
                    as: 'moduleAccess',
                    required: false
                }
            ]
        });

        if (!user) throw 'User not found';

        user.password = await hash(newPassword);
        await user.save();

        if (user.security) {
            await user.security.update({ mustChangePassword: false });
        } else {
            await UserSecurity.create({ UserId: user.id, mustChangePassword: false });
        }

        resetToken.usedAt = now;
        resetToken.resetByIp = originIp || null;
        await resetToken.save();

        await PasswordResetToken.update(
            { usedAt: now },
            {
                where: {
                    UserId: user.id,
                    usedAt: null,
                    id: {
                        [Op.ne]: resetToken.id
                    }
                }
            }
        );

        return { message: 'Password reset successful' };
    }
}

module.exports = new AuthService();

async function hash(password) {
    return await bcrypt.hash(password, 10);
}

function generateJwtToken(user) {
    return jwt.sign(
        {
            sub: user.id,
            id: user.id
        },
        config.jwtSecret,
        {
            expiresIn: '30d'
        }
    );
}

function hashResetToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
}
