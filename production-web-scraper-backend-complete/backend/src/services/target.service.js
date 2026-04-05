const httpStatus = require('http-status');
const { Target } = require('../db/models');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const { scheduleJob, removeJob } = require('./jobScheduler.service');

/**
 * Create a scraping target
 * @param {Object} targetBody
 * @param {string} userId
 * @returns {Promise<Target>}
 */
const createTarget = async (targetBody, userId) => {
  const target = await Target.create({ ...targetBody, userId });
  if (target.schedule) {
    await scheduleJob(target);
  }
  return target;
};

/**
 * Query for targets
 * @param {Object} filter
 * @param {Object} options
 * @returns {Promise<QueryResult>}
 */
const queryTargets = async (filter, options) => {
  const targets = await Target.findAndCountAll({
    where: filter,
    limit: options.limit,
    offset: (options.page - 1) * options.limit,
    order: options.sortBy ? [options.sortBy.split(':')] : [['createdAt', 'ASC']],
  });
  return targets;
};

/**
 * Get target by ID
 * @param {string} targetId
 * @returns {Promise<Target>}
 */
const getTargetById = async (targetId) => {
  const target = await Target.findByPk(targetId);
  if (!target) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Target not found');
  }
  return target;
};

/**
 * Update target by ID
 * @param {string} targetId
 * @param {Object} updateBody
 * @returns {Promise<Target>}
 */
const updateTargetById = async (targetId, updateBody) => {
  const target = await getTargetById(targetId);
  if (!target) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Target not found');
  }

  // If schedule is changed, remove old job and schedule new one
  if (updateBody.schedule !== undefined && updateBody.schedule !== target.schedule) {
    if (target.schedule) {
      await removeJob(target.id);
    }
    if (updateBody.schedule) {
      const updatedTarget = { ...target.toJSON(), ...updateBody };
      await scheduleJob(updatedTarget);
    }
  }

  Object.assign(target, updateBody);
  await target.save();
  return target;
};

/**
 * Delete target by ID
 * @param {string} targetId
 * @returns {Promise<Target>}
 */
const deleteTargetById = async (targetId) => {
  const target = await getTargetById(targetId);
  if (!target) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Target not found');
  }
  await target.destroy();
  await removeJob(target.id); // Also remove the scheduled job
  return target;
};

module.exports = {
  createTarget,
  queryTargets,
  getTargetById,
  updateTargetById,
  deleteTargetById,
};