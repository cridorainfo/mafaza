const authService     = require('../Services/auth.service');

class AuthController {

    async currentUser(req, res) {
        res.json(req.user)
    }

    async authenticate(req, res, next) {
        const { email, password } = req.body;
        const ipAddress           = req.ip;
        authService.authenticate({ email, password, ipAddress })
            .then(({ ...user }) => {
                res.json(user);
            })
            .catch(next);
    }

    async register(req, res, next) {
        authService.register(req.body, req.get('origin'))
            .then(() => res.json(
                { 
                    message: "Registration successful, please wait for admin's approval!" 
                }
            )).catch(next);
    }

    async forcePasswordReset(req, res, next) {
        authService.forcePasswordReset({
            userId: req.user.id,
            currentPassword: req.body.currentPassword,
            newPassword: req.body.newPassword
        })
            .then(user => res.json({
                message: 'Password updated successfully',
                user
            }))
            .catch(next);
    }

    async forgotPassword(req, res, next) {
        authService.requestPasswordReset({
            email: req.body.email,
            originIp: req.ip
        })
            .then(payload => res.json(payload))
            .catch(next);
    }

    async resetPassword(req, res, next) {
        authService.resetPassword({
            token: req.body.token,
            newPassword: req.body.newPassword,
            originIp: req.ip
        })
            .then(payload => res.json(payload))
            .catch(next);
    }

}
module.exports = new AuthController();
