```javascript
// backend/src/models/jobLog.model.js
module.exports = (sequelize, DataTypes) => {
  /**
   * @swagger
   * components:
   *   schemas:
   *     JobLog:
   *       type: object
   *       required:
   *         - jobId
   *         - level
   *         - message
   *       properties:
   *         id:
   *           type: integer
   *           description: The auto-generated ID of the job log entry.
   *           readOnly: true
   *         jobId:
   *           type: integer
   *           description: The ID of the scraping job this log entry belongs to.
   *         level:
   *           type: string
   *           enum: [info, warn, error]
   *           default: info
   *           description: The log level (info, warn, error).
   *         message:
   *           type: string
   *           description: The log message.
   *         timestamp:
   *           type: string
   *           format: date-time
   *           description: The timestamp when the log was recorded.
   *           readOnly: true
   *         createdAt:
   *           type: string
   *           format: date-time
   *           description: The date and time the entry was created.
   *           readOnly: true
   *         updatedAt:
   *           type: string
   *           format: date-time
   *           description: The date and time the entry was last updated.
   *           readOnly: true
   *       example:
   *         id: 1
   *         jobId: 1
   *         level: info
   *         message: "Scraping job started successfully."
   *         timestamp: "2023-01-01T12:00:00Z"
   *         createdAt: "2023-01-01T12:00:00Z"
   *         updatedAt: "2023-01-01T12:00:00Z"
   */
  const JobLog = sequelize.define('JobLog', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    jobId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'ScrapingJobs',
        key: 'id',
      },
    },
    level: {
      type: DataTypes.ENUM('info', 'warn', 'error'),
      allowNull: false,
      defaultValue: 'info',
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    // Query optimization: Indexes
    indexes: [
      {
        fields: ['jobId']
      },
      {
        fields: ['timestamp']
      }
    ]
  });

  JobLog.associate = (models) => {
    JobLog.belongsTo(models.ScrapingJob, {
      foreignKey: 'jobId',
      as: 'job',
    });
  };

  return JobLog;
};
```