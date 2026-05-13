const Joi = require('joi');
const validateRequest = require('../Middleware/ValidateRequest');
const { MODULE_KEYS } = require('../Utils/module-access');

function buildModuleSchema(required = true) {
    const shape = MODULE_KEYS.reduce((result, key) => {
        result[key] = Joi.boolean().required();
        return result;
    }, {});

    const schema = Joi.object(shape)
        .custom((value, helper) => {
            const hasAtLeastOne = Object.values(value).some(Boolean);
            if (!hasAtLeastOne) return helper.message('Select at least one module');
            return value;
        });

    return required ? schema.required() : schema.optional();
}

class ModularAccessValidation {
    async createSchema(req, res, next) {
        const schema = Joi.object({
            name: Joi.string().trim().required(),
            email: Joi.string().email().trim().lowercase().required(),
            password: Joi.string().min(6).required(),
            confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
            roleName: Joi.string().trim().min(2).max(100).required(),
            status: Joi.string().valid('verified', 'inactive').optional(),
            phoneNumber: Joi.string().allow('').optional(),
            address: Joi.string().allow('').optional(),
            country: Joi.string().allow('').optional(),
            modules: buildModuleSchema(true)
        });

        validateRequest(req, next, schema);
    }

    async updateSchema(req, res, next) {
        const schema = Joi.object({
            name: Joi.string().trim().optional(),
            email: Joi.string().email().trim().lowercase().optional(),
            roleName: Joi.string().trim().min(2).max(100).optional(),
            status: Joi.string().valid('verified', 'inactive').optional(),
            phoneNumber: Joi.string().allow('').optional(),
            address: Joi.string().allow('').optional(),
            country: Joi.string().allow('').optional(),
            modules: buildModuleSchema(false)
        }).or('name', 'email', 'roleName', 'status', 'phoneNumber', 'address', 'country', 'modules');

        validateRequest(req, next, schema);
    }
}

module.exports = new ModularAccessValidation();
