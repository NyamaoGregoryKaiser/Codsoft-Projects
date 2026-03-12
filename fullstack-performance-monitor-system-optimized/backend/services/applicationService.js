```javascript
const { Application, User } = require('../models');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

/**
 * Creates a new application for a user.
 * @param {string} userId - The ID of the user creating the application.
 * @param {object} appData - Application data (name, description).
 * @returns {object} - Newly created application object.
 * @throws {Error} If application name is not unique for the user or other validation fails.
 */
const createApplication = async (userId, appData) => {
  const { name, description } = appData;

  if (!name) {
    throw new Error('Application name is required.');
  }

  try {
    // Check for existing application with the same name for this user
    const existingApp = await Application.findOne({ where: { userId, name } });
    if (existingApp) {
      throw new Error('You already have an application with this name.');
    }

    const newApplication = await Application.create({
      userId,
      name,
      description,
      apiKey: uuidv4(), // Generate a unique API key
    });
    logger.info(`Application created: ${newApplication.name} by user ${userId}`);
    return newApplication;
  } catch (error) {
    logger.error(`Error creating application for user ${userId}:`, error.message);
    throw new Error(`Failed to create application: ${error.message}`);
  }
};

/**
 * Retrieves an application by its ID.
 * @param {string} appId - The ID of the application.
 * @returns {object} - Application object.
 * @throws {Error} If application not found.
 */
const getApplicationById = async (appId) => {
  try {
    const application = await Application.findByPk(appId, {
      include: [{ model: User, as: 'owner', attributes: ['id', 'username', 'email'] }],
    });
    if (!application) {
      throw new Error('Application not found.');
    }
    return application;
  } catch (error) {
    logger.error(`Error fetching application ${appId}:`, error.message);
    throw new Error(`Failed to retrieve application: ${error.message}`);
  }
};

/**
 * Retrieves all applications owned by a specific user.
 * @param {string} userId - The ID of the user.
 * @returns {Array<object>} - Array of application objects.
 */
const getUserApplications = async (userId) => {
  try {
    const applications = await Application.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
    });
    return applications;
  } catch (error) {
    logger.error(`Error fetching applications for user ${userId}:`, error.message);
    throw new Error(`Failed to retrieve user applications: ${error.message}`);
  }
};

/**
 * Updates an existing application.
 * @param {string} appId - The ID of the application to update.
 * @param {object} updateData - Data to update (name, description).
 * @returns {object} - Updated application object.
 * @throws {Error} If update fails or application not found.
 */
const updateApplication = async (appId, updateData) => {
  try {
    const application = await Application.findByPk(appId);
    if (!application) {
      throw new Error('Application not found.');
    }

    // Only allow specific fields to be updated
    if (updateData.name) application.name = updateData.name;
    if (updateData.description !== undefined) application.description = updateData.description;

    await application.save();
    logger.info(`Application ${appId} updated successfully.`);
    return application;
  } catch (error) {
    logger.error(`Error updating application ${appId}:`, error.message);
    if (error.name === 'SequelizeUniqueConstraintError') {
      throw new Error('An application with this name already exists for this user.');
    }
    throw new Error(`Failed to update application: ${error.message}`);
  }
};

/**
 * Regenerates the API key for an application.
 * @param {string} appId - The ID of the application.
 * @returns {object} - Updated application object with new API key.
 * @throws {Error} If application not found.
 */
const regenerateApiKey = async (appId) => {
  try {
    const application = await Application.findByPk(appId);
    if (!application) {
      throw new Error('Application not found.');
    }

    application.apiKey = uuidv4(); // Generate a new UUID
    await application.save();
    logger.info(`API Key regenerated for application ${appId}.`);
    return application;
  } catch (error) {
    logger.error(`Error regenerating API Key for application ${appId}:`, error.message);
    throw new Error(`Failed to regenerate API Key: ${error.message}`);
  }
};

/**
 * Deletes an application.
 * @param {string} appId - The ID of the application to delete.
 * @returns {boolean} - True if deletion was successful.
 * @throws {Error} If deletion fails or application not found.
 */
const deleteApplication = async (appId) => {
  try {
    const deletedRows = await Application.destroy({ where: { id: appId } });
    if (deletedRows === 0) {
      throw new Error('Application not found.');
    }
    logger.info(`Application ${appId} deleted successfully.`);
    return true;
  } catch (error) {
    logger.error(`Error deleting application ${appId}:`, error.message);
    throw new Error(`Failed to delete application: ${error.message}`);
  }
};

module.exports = {
  createApplication,
  getApplicationById,
  getUserApplications,
  updateApplication,
  regenerateApiKey,
  deleteApplication,
};
```