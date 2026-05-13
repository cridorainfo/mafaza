const { Notification, User } = require('../Models');
const { Op } = require('sequelize');

class NotificationService {
    async getForUser(user, { page = 1, perPage = 12, unreadOnly = false }) {
        const normalizedPage = Math.max(parseInt(page, 10) || 1, 1);
        const normalizedPerPage = Math.max(parseInt(perPage, 10) || 12, 1);
        const offset = (normalizedPage - 1) * normalizedPerPage;

        const whereClause = {
            UserId: user.id
        };

        if (['1', 'true', true, 1].includes(unreadOnly)) {
            whereClause.isRead = false;
        }

        const { count, rows } = await Notification.findAndCountAll({
            where: whereClause,
            order: [['createdAt', 'DESC']],
            limit: normalizedPerPage,
            offset
        });

        const unreadCount = await Notification.count({
            where: {
                UserId: user.id,
                isRead: false
            }
        });

        return {
            totalRecords: count,
            totalPages: Math.ceil(count / normalizedPerPage),
            currentPage: normalizedPage,
            perPage: normalizedPerPage,
            unreadCount,
            data: rows
        };
    }

    async markAsRead(id, user) {
        const notification = await Notification.findOne({
            where: {
                id,
                UserId: user.id
            }
        });

        if (!notification) throw 'Notification not found';

        if (!notification.isRead) {
            notification.isRead = true;
            notification.readAt = new Date();
            await notification.save();
        }

        return notification;
    }

    async markAllAsRead(user) {
        const [updatedCount] = await Notification.update(
            {
                isRead: true,
                readAt: new Date()
            },
            {
                where: {
                    UserId: user.id,
                    isRead: false
                }
            }
        );

        return {
            updatedCount
        };
    }

    async createForUsers(userIds, payload = {}) {
        const uniqueUserIds = [...new Set((userIds || []).map(id => Number(id)).filter(Boolean))];
        if (!uniqueUserIds.length) return [];

        const notifications = uniqueUserIds.map(UserId => ({
            UserId,
            title: payload.title || 'Notification',
            message: payload.message || '',
            category: payload.category || 'info',
            eventType: payload.eventType || null,
            link: payload.link || null,
            metadata: payload.metadata || null,
            isRead: false
        }));

        return Notification.bulkCreate(notifications);
    }

    async createForUser(userId, payload = {}) {
        return this.createForUsers([userId], payload);
    }

    async createForRole(role, payload = {}, statuses = ['verified']) {
        const whereClause = { role };

        if (Array.isArray(statuses) && statuses.length > 0) {
            whereClause.status = {
                [Op.in]: statuses
            };
        }

        const users = await User.findAll({
            attributes: ['id'],
            where: whereClause
        });

        const userIds = users.map(user => user.id);
        return this.createForUsers(userIds, payload);
    }

    async createForAdmins(payload = {}) {
        return this.createForRole('admin', payload, ['verified']);
    }

    async createForAllVerifiedUsers(payload = {}) {
        return this.createForRole('user', payload, ['verified']);
    }

    async safeCreateForUsers(userIds, payload = {}) {
        try {
            return await this.createForUsers(userIds, payload);
        } catch (error) {
            console.error('Notification createForUsers failed:', error?.message || error);
            return [];
        }
    }

    async safeCreateForUser(userId, payload = {}) {
        return this.safeCreateForUsers([userId], payload);
    }

    async safeCreateForAdmins(payload = {}) {
        try {
            return await this.createForAdmins(payload);
        } catch (error) {
            console.error('Notification createForAdmins failed:', error?.message || error);
            return [];
        }
    }

    async safeCreateForAllVerifiedUsers(payload = {}) {
        try {
            return await this.createForAllVerifiedUsers(payload);
        } catch (error) {
            console.error('Notification createForAllVerifiedUsers failed:', error?.message || error);
            return [];
        }
    }
}

module.exports = new NotificationService();
