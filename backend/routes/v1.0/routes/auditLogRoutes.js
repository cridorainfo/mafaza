const express = require('express');
const router = express.Router();
const authorize = require('../../../app/Middleware/Authorize');
const requirePrimaryAdmin = require('../../../app/Middleware/RequirePrimaryAdmin');
const auditLogController = require('../../../app/Controllers/AuditLogController');

router.get('/', authorize(['admin'], 'users'), requirePrimaryAdmin, auditLogController.getAll);

module.exports = router;
