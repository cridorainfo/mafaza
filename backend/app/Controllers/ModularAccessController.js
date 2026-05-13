const modularAccessService = require('../Services/modular-access.service');

class ModularAccessController {
    async getAll(req, res, next) {
        modularAccessService.getAll()
            .then(users => res.json(users))
            .catch(next);
    }

    async create(req, res, next) {
        modularAccessService.create(req.body)
            .then(user => res.status(201).json(user))
            .catch(next);
    }

    async update(req, res, next) {
        modularAccessService.update(req.params.id, req.body)
            .then(user => res.json(user))
            .catch(next);
    }
}

module.exports = new ModularAccessController();
