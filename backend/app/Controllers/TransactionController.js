const Role = require('../../config/role');
const transactionService     = require('../Services/transaction.service');

class TransactionController {

    async getAll(req, res, next) {
        const query = req.user.role === Role.Admin ? req.query : {...req.query, UserId: req.user.id }
        transactionService.getAll(query)
            .then(transactions => res.json(transactions))
            .catch(next);
    }

    async getById(req, res, next) {
        // users can get their own transaction and admins can get any transaction
        if (Number(req.params.id) !== req.user.id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        transactionService.getById(req.params.id)
            .then(transaction => transaction ? res.json(transaction) : res.sendStatus(404))
            .catch(next);
    }

    async create(req, res, next) {
        transactionService.create(req)
            .then(() => res.json(
                { 
                    message: 'Transaction successfully created!' 
                }
            )).catch(next);
    }

    async update(req, res, next) {
        if (req.user.role !== Role.Admin) 
            return res.status(401).json({ message: 'Unauthorized' });

        transactionService.update(req.params.id, req.body, req.file, req.user, req.ip)
            .then(user => res.json(user))
            .catch(next);
    }

}
module.exports = new TransactionController();
