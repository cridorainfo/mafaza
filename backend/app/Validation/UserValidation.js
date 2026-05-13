const Joi             = require('joi');
const validateRequest = require('../Middleware/ValidateRequest');
const Role            = require('../../config/role');

class UserValidation {

    async updateSchema(req, res, next) {
        const schemaRules = {
            name           : Joi.string().empty(''),
            email          : Joi.string().email().empty(''),
            currentPassword: Joi.string().min(6).empty(''),
            newPassword    : Joi.string().min(6).empty(''),
            address        : Joi.string().empty(''),
            country        : Joi.string().empty(''),
            phoneNumber    : Joi.string().empty(''),
        };

        // only admins can update role
        if (req.user.role === Role.Admin) {
            schemaRules.role = Joi.string().valid(Role.Admin, Role.User).empty('');
            schemaRules.status = Joi.string().valid("pending", "verified", "rejected","inactive").empty('');
        }

        const schema = Joi.object(schemaRules).with('password', 'confirmPassword');
        validateRequest(req, next, schema);
    }
}
module.exports = new UserValidation();