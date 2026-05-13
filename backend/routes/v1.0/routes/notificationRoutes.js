const express = require('express');
const router = express.Router();
const authorize = require('../../../app/Middleware/Authorize');
const notificationController = require('../../../app/Controllers/NotificationController');

router.get('/', authorize(['admin', 'user']), notificationController.getMy);
router.patch('/read-all', authorize(['admin', 'user']), notificationController.markAllAsRead);
router.patch('/:id/read', authorize(['admin', 'user']), notificationController.markAsRead);

module.exports = router;
