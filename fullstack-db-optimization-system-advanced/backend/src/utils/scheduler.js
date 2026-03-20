const cron = require('node-cron');
const logger = require('./logger');

/**
 * Schedules a cron job.
 * @param {string} cronExpression - The cron expression (e.g., '0 */1 * * *' for every hour).
 * @param {function} taskFunction - The asynchronous function to execute.
 * @param {string} taskName - A descriptive name for the task.
 * @returns {cron.ScheduledTask} The scheduled task instance.
 */
const scheduleJob = (cronExpression, taskFunction, taskName = 'Cron Job') => {
  if (!cron.validate(cronExpression)) {
    logger.error(`Invalid cron expression for task "${taskName}": ${cronExpression}`);
    return null;
  }

  const task = cron.schedule(cronExpression, async () => {
    logger.info(`Starting scheduled task: ${taskName}`);
    try {
      await taskFunction();
      logger.info(`Completed scheduled task: ${taskName}`);
    } catch (error) {
      logger.error(`Error in scheduled task "${taskName}": ${error.message}`, error);
    }
  }, {
    scheduled: true,
    timezone: "UTC" // or a specific timezone like "America/New_York"
  });

  logger.info(`Scheduled task "${taskName}" with cron expression: "${cronExpression}"`);
  return task;
};

module.exports = {
  scheduleJob,
};