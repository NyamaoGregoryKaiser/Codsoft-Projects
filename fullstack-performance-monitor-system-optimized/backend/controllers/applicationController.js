```javascript
const applicationService = require('../services/applicationService');
const logger = require('../utils/logger');

/**
 * Creates a new application.
 * Requires authentication. `req.user.id` is used as userId.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
const createApplication = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const userId = req.user.id;
    const newApp = await applicationService.createApplication(userId, { name, description });
    res.status(201).json({
      status: 'success',
      data: newApp,
      message: 'Application created successfully.',
    });
  } catch (error) {
    logger.error(`Error creating application for user ${req.user.id}:`, error.message);
    next(error);
  }
};

/**
 * Gets a single application by ID.
 * Requires authentication and authorization (user must own the app).
 * `req.application` is populated by `authorizeApplicationOwner` middleware.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
const getApplication = async (req, res, next) => {
  try {
    // Application object is already attached by authorizeApplicationOwner middleware
    res.status(200).json({
      status: 'success',
      data: req.application,
      message: 'Application retrieved successfully.',
    });
  } catch (error) {
    logger.error(`Error getting application ${req.params.appId}:`, error.message);
    next(error);
  }
};

/**
 * Gets all applications for the authenticated user.
 * Requires authentication. `req.user.id` is used.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
const getUserApplications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const applications = await applicationService.getUserApplications(userId);
    res.status(200).json({
      status: 'success',
      data: applications,
      message: 'User applications retrieved successfully.',
    });
  } catch (error) {
    logger.error(`Error getting applications for user ${req.user.id}:`, error.message);
    next(error);
  }
};

/**
 * Updates an application.
 * Requires authentication and authorization.
 * `req.application` is populated by `authorizeApplicationOwner` middleware.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
const updateApplication = async (req, res, next) => {
  try {
    const { appId } = req.params;
    const { name, description } = req.body;
    const updatedApp = await applicationService.updateApplication(appId, { name, description });
    res.status(200).json({
      status: 'success',
      data: updatedApp,
      message: 'Application updated successfully.',
    });
  } catch (error) {
    logger.error(`Error updating application ${req.params.appId}:`, error.message);
    next(error);
  }
};

/**
 * Regenerates the API key for an application.
 * Requires authentication and authorization.
 * `req.application` is populated by `authorizeApplicationOwner` middleware.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
const regenerateApiKey = async (req, res, next) => {
  try {
    const { appId } = req.params;
    const updatedApp = await applicationService.regenerateApiKey(appId);
    res.status(200).json({
      status: 'success',
      data: { apiKey: updatedApp.apiKey },
      message: 'API Key regenerated successfully.',
    });
  } catch (error) {
    logger.error(`Error regenerating API Key for application ${req.params.appId}:`, error.message);
    next(error);
  }
};

/**
 * Deletes an application.
 * Requires authentication and authorization.
 * `req.application` is populated by `authorizeApplicationOwner` middleware.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
const deleteApplication = async (req, res, next) => {
  try {
    const { appId } = req.params;
    await applicationService.deleteApplication(appId);
    res.status(204).json({
      status: 'success',
      data: null,
      message: 'Application deleted successfully.',
    });
  } catch (error) {
    logger.error(`Error deleting application ${req.params.appId}:`, error.message);
    next(error);
  }
};

module.exports = {
  createApplication,
  getApplication,
  getUserApplications,
  updateApplication,
  regenerateApiKey,
  deleteApplication,
};
```