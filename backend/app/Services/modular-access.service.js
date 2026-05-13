const bcrypt = require('bcryptjs');
const Role = require('../../config/role');
const { Op } = require('sequelize');
const { User, UserModuleAccess } = require('../Models');
const { serializeUserForClient, toModuleAccessRecord, MODULE_KEYS } = require('../Utils/module-access');

class ModularAccessService {
    async getAll() {
        const users = await User.findAll({
            where: {
                role: Role.Admin,
                status: {
                    [Op.ne]: 'pending'
                }
            },
            include: [
                {
                    model: UserModuleAccess,
                    as: 'moduleAccess',
                    required: false
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        return users.map(serializeUserForClient);
    }

    async create(params) {
        const email = String(params.email || '').trim().toLowerCase();
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) throw 'This email is already registered!';

        const user = await User.create({
            name: String(params.name || '').trim(),
            email,
            password: await hash(params.password),
            phoneNumber: params.phoneNumber || null,
            address: params.address || null,
            country: params.country || null,
            role: Role.Admin,
            status: params.status || 'verified'
        });

        await UserModuleAccess.create({
            UserId: user.id,
            ...toModuleAccessRecord(params)
        });

        const createdUser = await User.findByPk(user.id, {
            include: [
                {
                    model: UserModuleAccess,
                    as: 'moduleAccess',
                    required: false
                }
            ]
        });

        return serializeUserForClient(createdUser);
    }

    async update(id, params) {
        const user = await User.findByPk(id, {
            include: [
                {
                    model: UserModuleAccess,
                    as: 'moduleAccess',
                    required: false
                }
            ]
        });

        if (!user) throw 'User not found';
        if (user.role !== Role.Admin) throw 'Only admin users can have modular access';

        const updatedEmail = typeof params.email === 'string'
            ? params.email.trim().toLowerCase()
            : user.email;

        if (updatedEmail !== user.email) {
            const existingUser = await User.findOne({
                where: {
                    email: updatedEmail,
                    id: { [Op.ne]: user.id }
                }
            });

            if (existingUser) throw 'This email is already registered!';
            user.email = updatedEmail;
        }

        if (typeof params.name === 'string') user.name = params.name.trim();
        if (typeof params.status === 'string') user.status = params.status;
        if (typeof params.phoneNumber !== 'undefined') user.phoneNumber = params.phoneNumber || null;
        if (typeof params.address !== 'undefined') user.address = params.address || null;
        if (typeof params.country !== 'undefined') user.country = params.country || null;

        await user.save();

        const currentModules = MODULE_KEYS.reduce((result, key) => {
            result[key] = Boolean(user.moduleAccess?.[key]);
            return result;
        }, {});

        const mergedModules = MODULE_KEYS.reduce((result, key) => {
            if (params.modules && Object.prototype.hasOwnProperty.call(params.modules, key)) {
                result[key] = Boolean(params.modules[key]);
                return result;
            }

            result[key] = currentModules[key];
            return result;
        }, {});

        const roleName = typeof params.roleName === 'string'
            ? params.roleName.trim()
            : (user.moduleAccess?.roleName || 'Custom Role');

        const moduleAccessPayload = toModuleAccessRecord({
            roleName,
            modules: mergedModules
        });

        if (user.moduleAccess) {
            await user.moduleAccess.update(moduleAccessPayload);
        } else {
            await UserModuleAccess.create({
                UserId: user.id,
                ...moduleAccessPayload
            });
        }

        const updatedUser = await User.findByPk(user.id, {
            include: [
                {
                    model: UserModuleAccess,
                    as: 'moduleAccess',
                    required: false
                }
            ]
        });

        return serializeUserForClient(updatedUser);
    }
}

module.exports = new ModularAccessService();

async function hash(password) {
    return await bcrypt.hash(password, 10);
}
