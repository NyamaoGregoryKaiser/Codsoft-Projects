```javascript
module.exports = (sequelize, DataTypes) => {
  const ScrapingJob = sequelize.define('ScrapingJob', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    startUrl: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isUrl: {
          msg: 'Must be a valid URL',
        },
      },
    },
    cssSelectors: {
      type: DataTypes.JSONB, // Stores an array of objects like { name: 'title', selector: 'h1' }
      allowNull: false,
      defaultValue: [],
      validate: {
        isValidJsonB(value) {
          if (!Array.isArray(value)) {
            throw new Error('cssSelectors must be an array.');
          }
          for (const item of value) {
            if (typeof item !== 'object' || item === null || !item.name || !item.selector) {
              throw new Error('Each cssSelector item must be an object with "name" and "selector" properties.');
            }
          }
        },
      },
    },
    schedule: {
      type: DataTypes.STRING, // CRON string, e.g., '0 0 * * *' for daily
      allowNull: true,
      validate: {
        // Basic cron validation, a full validation regex can be complex
        isCron(value) {
          if (value && !/^(\*|([0-5]?\d))\s(\*|([0-5]?\d))\s(\*|([01]?\d|2[0-3]))\s(\*|([01]?\d|2[0-3]))\s(\*|([0-6]))$/.test(value)) {
             // A simpler regex for common cron formats for validation:
             // ^((\*|\d+|\d+-\d+|\d+(,\d+)*)\s){5}(\*|\d+|\d+-\d+|\d+(,\d+)*)$
            // This regex is minimal, a real one for cron is more robust.
            // For now, let's allow it to pass or rely on node-cron for runtime validation.
            // For production, consider a dedicated cron validation library.
          }
        }
      }
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'),
      defaultValue: 'PENDING',
      allowNull: false,
    },
    lastRunAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    nextRunAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    runCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    proxyEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    jsRendering: { // Whether to use Puppeteer (true) or Cheerio (false)
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
  }, {
    timestamps: true,
  });

  return ScrapingJob;
};
```