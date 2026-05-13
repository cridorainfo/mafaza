const Joi = require('joi');
const validateRequest = require('../Middleware/ValidateRequest');

class MigrationValidation {
    async importSchema(req, res, next) {
        const schema = Joi.object({
            users: Joi.array().items(
                Joi.object({
                    email: Joi.string().email().required(),
                    name: Joi.string().required(),
                    phoneNumber: Joi.string().allow('', null).optional(),
                    address: Joi.string().allow('', null).optional(),
                    country: Joi.string().allow('', null).optional(),
                    role: Joi.string().allow('', null).optional(),
                    status: Joi.string().allow('', null).optional()
                })
            ).default([]),
            projects: Joi.array().items(
                Joi.object({
                    project_code: Joi.string().required(),
                    name: Joi.string().required(),
                    totalInvestement: Joi.alternatives().try(Joi.number(), Joi.string()).required(),
                    minROI: Joi.alternatives().try(Joi.number(), Joi.string()).required(),
                    maxROI: Joi.alternatives().try(Joi.number(), Joi.string()).required(),
                    description: Joi.string().required(),
                    isActive: Joi.alternatives().try(Joi.boolean(), Joi.number(), Joi.string()).optional()
                })
            ).default([]),
            assignments: Joi.array().items(
                Joi.object({
                    user_email: Joi.string().email().required(),
                    project_code: Joi.string().required(),
                    roi: Joi.alternatives().try(Joi.number(), Joi.string()).required(),
                    investment: Joi.alternatives().try(Joi.number(), Joi.string()).optional(),
                    withdrawal: Joi.alternatives().try(Joi.number(), Joi.string()).optional(),
                    returnPeriod: Joi.string().required(),
                    date: Joi.alternatives().try(Joi.date(), Joi.string()).optional(),
                    investment_date: Joi.alternatives().try(Joi.date(), Joi.string()).optional(),
                    assignment_date: Joi.alternatives().try(Joi.date(), Joi.string()).optional(),
                    withdrawal_date: Joi.alternatives().try(Joi.date(), Joi.string()).optional(),
                    withdrawalDate: Joi.alternatives().try(Joi.date(), Joi.string()).optional()
                })
            ).default([]),
            sendEmails: Joi.boolean().optional()
        });

        validateRequest(req, next, schema);
    }
}

module.exports = new MigrationValidation();
