const { User, UserSecurity } = require('../Models');
const { Op } = require('sequelize');
const bcrypt    = require('bcryptjs');
const auditLogService = require('./audit-log.service');
const notificationService = require('./notification.service');

class UserService {
  
    async getAll({ page = 1, perPage = 10, sort = 'DESC', sortColumn = 'createdAt', q, status }) {
        page = parseInt(page)
        perPage = parseInt(perPage)

        const offset = (page - 1) * perPage;
        let whereClause = {};
        if(status) whereClause.status = status
        if(q) {
            whereClause = { 
                ...whereClause,  
                [Op.or]: [
                    { email: { [Op.like]: `%${q}%` } },
                    { phoneNumber: { [Op.like]: `%${q}%` } },
                    { name: { [Op.like]: `%${q}%` } }
                ],
            }
        } 
        
        const { count, rows } = await User.findAndCountAll({
            where: whereClause,
            limit: perPage,
            offset: offset,
            order: [[sortColumn, sort]]
        });

        return {
            totalRecords: count,
            totalPages: Math.ceil(count / perPage),
            currentPage: page,
            perPage,
            data: rows
        };
    }

    async countByStatus(status) {
        return await User.count({
            where: { status }
        });
    }

    async getById(id) {
        const user = await User.findByPk(id);
        return user;
    }


    async update(id, params, file, actorUser, ipAddress) {
        const user = await User.scope('withHash').findOne({ where: { id } });
        const previousStatus = user?.status;

        if(params.status === "rejected"){
            await notificationService.safeCreateForAdmins({
                title: 'User Rejected',
                message: `${user?.name || `User #${id}`} was rejected and removed.`,
                category: 'warning',
                eventType: 'user_rejected',
                link: '/users',
                metadata: {
                    userId: id,
                    previousStatus
                }
            });

            await this.delete(id)

            if (actorUser?.role === "admin") {
                await auditLogService.log({
                    actorUser,
                    action: 'user_rejected',
                    description: `Rejected and removed user #${id}`,
                    targetType: 'user',
                    targetId: id,
                    metadata: {
                        from: previousStatus,
                        to: 'rejected'
                    },
                    ipAddress
                });
            }

            return user
        }

        // validate (if email was changed)
        if (params.email && user.email !== params.email && await User.findOne({ where: { email: params.email } })) {
            throw 'Email "' + params.email + '" is already taken';
        }

        // hash password if it was entered
        if (params.newPassword) {
            if (!user || !(await bcrypt.compare(params.currentPassword, user.password))) 
                throw 'Password is incorrect';
            params.password = await hash(params.newPassword);

            const security = await UserSecurity.findOne({ where: { UserId: user.id } });
            if (security) {
                await security.update({ mustChangePassword: false });
            }
        }

        if (file) {
            params.avatar = `/uploads/${file.filename}`;
        }

        // copy params to user and save
        Object.assign(user, params);
        user.updated = Date.now();
        await user.save()

        if (actorUser?.role === "admin" && params.status && params.status !== previousStatus) {
            await notificationService.safeCreateForUser(user.id, {
                title: 'Account Status Updated',
                message: `Your account status was changed from ${previousStatus || 'N/A'} to ${params.status}.`,
                category: params.status === 'verified' ? 'success' : 'warning',
                eventType: 'user_status_updated',
                link: '/account-settings',
                metadata: {
                    from: previousStatus,
                    to: params.status
                }
            });

            await notificationService.safeCreateForAdmins({
                title: 'User Status Changed',
                message: `${user.name} status changed from ${previousStatus || 'N/A'} to ${params.status}.`,
                category: 'info',
                eventType: 'admin_user_status_updated',
                link: '/users',
                metadata: {
                    userId: user.id,
                    from: previousStatus,
                    to: params.status
                }
            });
        }

        if (actorUser?.role === "admin" && params.status && params.status !== previousStatus) {
            await auditLogService.log({
                actorUser,
                action: 'user_status_updated',
                description: `Changed user #${user.id} status from ${previousStatus} to ${params.status}`,
                targetType: 'user',
                targetId: user.id,
                metadata: {
                    from: previousStatus,
                    to: params.status
                },
                ipAddress
            });
        }

        return user;
    }

    async delete(id) {
        const user = await getUser(id);
        await user.destroy();
    }

    
}

module.exports = new UserService();

async function getUser(id) {
    const user = await User.findByPk(id);
    if (!user) throw 'User not found';
    return user;
}


async function hash(password) {
    return await bcrypt.hash(password, 10);
}
