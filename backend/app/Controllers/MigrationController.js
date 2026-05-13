const migrationService = require('../Services/migration.service');

class MigrationController {
    async template(req, res, next) {
        migrationService.getTemplate()
            .then(data => res.json(data))
            .catch(next);
    }

    async exportData(req, res, next) {
        migrationService.exportData()
            .then(data => res.json(data))
            .catch(next);
    }

    async importData(req, res, next) {
        try {
            const result = await migrationService.importData(req.body, req.user);
            res.json(result);
        } catch (error) {
            if (error?.code === 'MIGRATION_VALIDATION') {
                return res.status(400).json({
                    message: error.message || 'Migration validation failed',
                    details: error.details || []
                });
            }
            next(error);
        }
    }
}

module.exports = new MigrationController();
