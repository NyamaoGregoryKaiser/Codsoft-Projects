```javascript
const Joi = require('joi');

const registerSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .required()
    .messages({
      'string.alphanum': 'Username must only contain alphanumeric characters.',
      'string.min': 'Username must be at least {#limit} characters long.',
      'string.max': 'Username must be at most {#limit} characters long.',
      'string.empty': 'Username cannot be empty.',
      'any.required': 'Username is required.'
    }),
  email: Joi.string()
    .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net', 'org', 'co', 'io'] } })
    .required()
    .messages({
      'string.email': 'Please provide a valid email address.',
      'string.empty': 'Email cannot be empty.',
      'any.required': 'Email is required.'
    }),
  password: Joi.string()
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})'))
    .required()
    .messages({
      'string.pattern.base': 'Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.',
      'string.empty': 'Password cannot be empty.',
      'any.required': 'Password is required.'
    }),
});

const loginSchema = Joi.object({
  email: Joi.string()
    .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net', 'org', 'co', 'io'] } })
    .required()
    .messages({
      'string.email': 'Please provide a valid email address.',
      'string.empty': 'Email cannot be empty.',
      'any.required': 'Email is required.'
    }),
  password: Joi.string()
    .required()
    .messages({
      'string.empty': 'Password cannot be empty.',
      'any.required': 'Password is required.'
    }),
});

module.exports = {
  registerSchema,
  loginSchema,
};
```