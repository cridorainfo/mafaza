const Joi             = require('joi');
const validateRequest = require('../Middleware/ValidateRequest');

class AuthValidation {
    async authenticateSchema(req, res, next) {
        const schema = Joi.object({
            email: Joi.string().trim().lowercase().required(),
            password: Joi.string().required()
        });
        validateRequest(req, next, schema);
    }

    async registerSchema(req, res, next) {
        const schema = Joi.object({
            name: Joi.string().required(),
            email: Joi.string().email().trim().lowercase().required(),
            address: Joi.string().required(),
            phoneNumber: Joi.string().min(6).required(),
            password: Joi.string().min(6).required(),
            confirmPassword: Joi.string().valid(Joi.ref('password')).required()
        });
        validateRequest(req, next, schema);
    }

    async forcePasswordResetSchema(req, res, next) {
        const schema = Joi.object({
            currentPassword: Joi.string().min(6).required(),
            newPassword: Joi.string().min(6).required(),
            confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required()
        });
        validateRequest(req, next, schema);
    }

    async forgotPasswordSchema(req, res, next) {
        const schema = Joi.object({
            email: Joi.string().email().trim().lowercase().required()
        });
        validateRequest(req, next, schema);
    }

    async resetPasswordSchema(req, res, next) {
        const schema = Joi.object({
            token: Joi.string().min(20).required(),
            newPassword: Joi.string().min(6).required(),
            confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required()
        });
        validateRequest(req, next, schema);
    }

}
module.exports = new AuthValidation();
