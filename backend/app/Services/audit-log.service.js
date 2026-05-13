const { Op } = require('sequelize');
const { AuditLog, User } = require('../Models');

class AuditLogService {
    async getAll({ page = 1, perPage = 20, sort = 'DESC', sortColumn = 'createdAt', q, action, targetType, UserId }) {
        page = parseInt(page);
        perPage = parseInt(perPage);
        const offset = (page - 1) * perPage;

        const whereClause = {};
        if (action) whereClause.action = action;
        if (targetType) whereClause.targetType = targetType;
        if (UserId) whereClause.UserId = UserId;

        if (q) {
            const likeOperator = AuditLog.sequelize.getDialect() === 'postgres' ? Op.iLike : Op.like;
            whereClause[Op.or] = [
                { action: { [likeOperator]: `%${q}%` } },
                { description: { [likeOperator]: `%${q}%` } },
                { targetType: { [likeOperator]: `%${q}%` } }
            ];
        }

        const allowedSortColumns = ['createdAt', 'action', 'targetType', 'UserId'];
        const safeSortColumn = allowedSortColumns.includes(sortColumn) ? sortColumn : 'createdAt';
        const safeSort = String(sort).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        const { count, rows } = await AuditLog.findAndCountAll({
            where: whereClause,
            limit: perPage,
            offset,
            include: [
                {
                    model: User,
                    as: 'actor',
                    attributes: ['id', 'name', 'email', 'role'],
                    required: false
                }
            ],
            order: [[safeSortColumn, safeSort]]
        });

        return {
            totalRecords: count,
            totalPages: Math.ceil(count / perPage),
            currentPage: page,
            perPage,
            data: rows
        };
    }

    async log({ actorUser, action, description, targetType = null, targetId = null, metadata = null, ipAddress = null }) {
        if (!actorUser || !actorUser.id || !action || !description) return null;

        try {
            return await AuditLog.create({
                UserId: actorUser.id,
                action,
                description,
                targetType,
                targetId: targetId !== null && targetId !== undefined ? String(targetId) : null,
                metadata,
                ipAddress
            });
        } catch (error) {
            console.error('Failed to write audit log:', error.message);
            return null;
        }
    }
}

module.exports = new AuditLogService();
