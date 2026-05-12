```javascript
const Joi = require('joi');
const httpStatus = require('http-status-codes');
const ApiError = require('./ApiError');

const validate = (schema) => (req, res, next) => {
  const validSchema = ['params', 'query', 'body'].reduce((acc, key) => {
    if (schema[key]) {
      acc[key] = schema[key];
    }
    return acc;
  }, {});
  const obj = ['params', 'query', 'body'].reduce((acc, key) => {
    if (schema[key]) {
      acc[key] = req[key];
    }
    return acc;
  }, {});

  const { value, error } = Joi.compile(validSchema)
    .prefs({ errors: { label: 'key' }, abortEarly: false })
    .validate(obj);

  if (error) {
    const errorMessage = error.details.map((details) => details.message).join(', ');
    return next(new ApiError(httpStatus.BAD_REQUEST, errorMessage));
  }
  Object.assign(req, value);
  return next();
};

module.exports = validate;
```