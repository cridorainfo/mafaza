const Role = require('../../config/role');
const userService     = require('../Services/user.service');

class UserController {

    async getAll(req, res, next) {
        userService.getAll(req.query)
            .then(users => res.json(users))
            .catch(next);
    }

    async getById(req, res, next) {
        // users can get their own user and admins can get any user
        if (Number(req.params.id) !== req.user.id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        userService.getById(req.params.id)
            .then(user => user ? res.json(user) : res.sendStatus(404))
            .catch(next);
    }

    async update(req, res, next) {
        // users can update their own user and admins can update any user
        // if (req.user.role !== Role.Admin) {
        //     return res.status(401).json({ message: 'Unauthorized' });
        // }

        userService.update(req.params.id, req.body, req.file, req.user, req.ip)
            .then(user => res.json(user))
            .catch(next);
    }

    async _delete(req, res, next) {
        // users can delete their own user and admins can delete any user
        if (Number(req.params.id) !== req.user.id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        userService.delete(req.params.id)
            .then(() => res.json({ message: 'User deleted successfully' }))
            .catch(next);
    }

}
module.exports = new UserController();
