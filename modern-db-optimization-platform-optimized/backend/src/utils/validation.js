const Joi = require('joi');

const validationSchema = {
    register: Joi.object({
        username: Joi.string().alphanum().min(3).max(30).required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
    }),
    login: Joi.object({
        username: Joi.string().required(),
        password: Joi.string().required(),
    }),
    createDbConnection: Joi.object({
        name: Joi.string().min(3).max(100).required(),
        type: Joi.string().valid('postgresql').default('postgresql'), // Extend for other DB types
        host: Joi.string().required(),
        port: Joi.number().integer().min(1).max(65535).default(5432),
        username: Joi.string().required(),
        password: Joi.string().required(),
        database: Joi.string().required(),
        is_monitoring_active: Joi.boolean().default(false),
    }),
    updateDbConnection: Joi.object({
        name: Joi.string().min(3).max(100),
        type: Joi.string().valid('postgresql'),
        host: Joi.string(),
        port: Joi.number().integer().min(1).max(65535),
        username: Joi.string(),
        password: Joi.string(), // Allow password update
        database: Joi.string(),
        is_monitoring_active: Joi.boolean(),
    }).min(1), // At least one field must be present for update
    updateRecommendationStatus: Joi.object({
        status: Joi.string().valid('pending', 'implemented', 'dismissed').required(),
    })
};

module.exports = {
    validationSchema,
};