const auditLogService = require('../Services/audit-log.service');

class AuditLogController {
    async getAll(req, res, next) {
        auditLogService.getAll(req.query)
            .then(logs => res.json(logs))
            .catch(next);
    }
}

module.exports = new AuditLogController();
