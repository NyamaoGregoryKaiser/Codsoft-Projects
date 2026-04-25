```javascript
// backend/src/models/job.model.js
module.exports = (sequelize, DataTypes) => {
  /**
   * @swagger
   * components:
   *   schemas:
   *     ScrapingJob:
   *       type: object
   *       required:
   *         - name
   *         - websiteId
   *         - selectorConfig
   *         - userId
   *       properties:
   *         id:
   *           type: integer
   *           description: The auto-generated ID of the scraping job.
   *           readOnly: true
   *         name:
   *           type: string
   *           description: A descriptive name for the scraping job.
   *         websiteId:
   *           type: integer
   *           description: The ID of the target website for this job.
   *         cronSchedule:
   *           type: string
   *           nullable: true
   *           description: Cron schedule string for periodic scraping (e.g., "0 0 * * *").
   *         status:
   *           type: string
   *           enum: [pending, running, completed, failed, stopped]
   *           default: pending
   *           description: Current status of the scraping job.
   *         lastRun:
   *           type: string
   *           format: date-time
   *           nullable: true
   *           description: Timestamp of the last successful run.
   *         nextRun:
   *           type: string
   *           format: date-time
   *           nullable: true
   *           description: Timestamp of the next scheduled run.
   *         selectorConfig:
   *           type: object
   *           description: JSON configuration for CSS selectors and data extraction rules.
   *           example:
   *             title: ".article-title"
   *             content: ".article-body p"
   *             link: "a.read-more[href]"
   *         userId:
   *           type: integer
   *           description: The ID of the user who created this job.
   *         createdAt:
   *           type: string
   *           format: date-time
   *           description: The date and time the job was created.
   *           readOnly: true
   *         updatedAt:
   *           type: string
   *           format: date-time
   *           description: The date and time the job was last updated.
   *           readOnly: true
   *       example:
   *         id: 1
   *         name: Scrape Latest Articles
   *         websiteId: 1
   *         cronSchedule: "0 * * * *"
   *         status: pending
   *         selectorConfig: { "title": "h1.entry-title", "url": "a.permalink[href]" }
   *         userId: 1
   *         createdAt: "2023-01-01T12:00:00Z"
   *         updatedAt: "2023-01-01T12:00:00Z"
   */
  const ScrapingJob = sequelize.define('ScrapingJob', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    websiteId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Websites',
        key: 'id',
      },
    },
    cronSchedule: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        // Basic regex for cron validation, can be improved
        isCron: function(value) {
          if (value && !/^(\*|([0-5]?\d))\s(\*|([0-5]?\d))\s(\*|([01]?\d|2[0-3]))\s(\*|([01]?\d|2[0-9]|3[01]))\s(\*|([1-9]|1[0-2]))$/.test(value)) {
            throw new Error('Invalid cron schedule format.');
          }
        }
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'running', 'completed', 'failed', 'stopped'),
      allowNull: false,
      defaultValue: 'pending',
    },
    lastRun: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    nextRun: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    selectorConfig: {
      type: DataTypes.JSONB, // Stores scraping rules as JSON
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
  }, {
    // Query optimization: Indexes
    indexes: [
      {
        fields: ['websiteId']
      },
      {
        fields: ['userId']
      },
      {
        fields: ['status']
      }
    ]
  });

  ScrapingJob.associate = (models) => {
    ScrapingJob.belongsTo(models.Website, {
      foreignKey: 'websiteId',
      as: 'website',
    });
    ScrapingJob.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
    ScrapingJob.hasMany(models.ScrapedData, {
      foreignKey: 'jobId',
      as: 'scrapedData',
    });
    ScrapingJob.hasMany(models.JobLog, {
      foreignKey: 'jobId',
      as: 'logs',
    });
  };

  return ScrapingJob;
};
```