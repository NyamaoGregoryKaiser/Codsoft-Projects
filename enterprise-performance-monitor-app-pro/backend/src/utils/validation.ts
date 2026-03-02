import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  return res.status(400).json({ errors: errors.array() });
};

// --- Validation Schemas ---

export const registerValidation = [
  body('username').notEmpty().withMessage('Username is required').isLength({ min: 3 }).withMessage('Username must be at least 3 characters long'),
  body('email').isEmail().withMessage('Please enter a valid email address'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
];

export const loginValidation = [
  body('email').isEmail().withMessage('Please enter a valid email address'),
  body('password').notEmpty().withMessage('Password is required'),
];

export const createApplicationValidation = [
  body('name').notEmpty().withMessage('Application name is required').isLength({ min: 3 }).withMessage('Name must be at least 3 characters long'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
];

export const createPageValidation = [
  body('name').notEmpty().withMessage('Page name is required').isLength({ min: 3 }).withMessage('Name must be at least 3 characters long'),
  body('pathRegex').optional().isString().withMessage('Path regex must be a string'),
];

export const performanceMetricValidation = [
  body('metrics').isArray().withMessage('Metrics must be an array'),
  body('metrics.*.metricType').notEmpty().withMessage('Metric type is required').isString(),
  body('metrics.*.value').isFloat().withMessage('Metric value must be a number'),
  body('metrics.*.timestamp').optional().isISO8601().withMessage('Timestamp must be a valid ISO 8601 date string'),
  body('metrics.*.pageName').optional().isString().withMessage('Page name must be a string'), // For dynamic page creation
  body('metrics.*.url').optional().isURL().withMessage('URL must be a valid URL'),
  body('metrics.*.userSessionId').optional().isUUID().withMessage('User session ID must be a valid UUID'),
  body('metrics.*.browser').optional().isString(),
  body('metrics.*.os').optional().isString(),
  body('metrics.*.deviceType').optional().isIn(['desktop', 'mobile', 'tablet']).withMessage('Invalid device type'),
  body('metrics.*.country').optional().isString().isLength({ max: 50 }),
];