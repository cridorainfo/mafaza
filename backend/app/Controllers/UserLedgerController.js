const Role = require('../../config/role');
const userLedgerService     = require('../Services/user-ledger.service');

class UserLedgerController {

    async getAll(req, res, next) {
        const query = req.user.role === Role.Admin ? req.query : {...req.query, UserId: req.user.id }
        userLedgerService.getAll(query)
            .then(ledgers => res.json(ledgers))
            .catch(next);
    }

    async assignProject(req, res, next) {
        userLedgerService.assignProject(req, req.get('origin'))
            .then(() => res.json(
                { 
                    message: 'Project successfully assign to the user!' 
                }
            )).catch(next);
    }

    async update(req, res, next) {
        if (![Role.Admin, Role.SuperAdmin].includes(req.user.role)) 
            return res.status(401).json({ message: 'Unauthorized' });

        userLedgerService.update(req.params.id, req.body)
            .then(ledger => res.json(ledger))
            .catch(next);
    }
}

module.exports = new UserLedgerController();