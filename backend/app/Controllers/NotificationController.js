const notificationService = require('../Services/notification.service');

class NotificationController {
    async getMy(req, res, next) {
        notificationService.getForUser(req.user, req.query)
            .then(payload => res.json(payload))
            .catch(next);
    }

    async markAsRead(req, res, next) {
        notificationService.markAsRead(req.params.id, req.user)
            .then(notification => res.json(notification))
            .catch(next);
    }

    async markAllAsRead(req, res, next) {
        notificationService.markAllAsRead(req.user)
            .then(payload => res.json(payload))
            .catch(next);
    }
}

module.exports = new NotificationController();
