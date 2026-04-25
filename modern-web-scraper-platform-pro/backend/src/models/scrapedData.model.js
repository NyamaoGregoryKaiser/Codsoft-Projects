```javascript
// backend/src/models/scrapedData.model.js
module.exports = (sequelize, DataTypes) => {
  /**
   * @swagger
   * components:
   *   schemas:
   *     ScrapedData:
   *       type: object
   *       required:
   *         - jobId
   *         - websiteId
   *         - data
   *       properties:
   *         id:
   *           type: integer
   *           description: The auto-generated ID of the scraped data entry.
   *           readOnly: true
   *         jobId:
   *           type: integer
   *           description: The ID of the scraping job that generated this data.
   *         websiteId:
   *           type: integer
   *           description: The ID of the website from which this data was scraped.
   *         data:
   *           type: object
   *           description: The actual scraped data, stored as a JSON object.
   *           example:
   *             title: "Latest News Article"
   *             url: "https://example.com/news/latest"
   *             date: "2023-03-15"
   *         scrapedAt:
   *           type: string
   *           format: date-time
   *           description: Timestamp when the data was scraped.
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
   *         websiteId: 1
   *         data: { "title": "Article Title", "author": "John Doe" }
   *         scrapedAt: "2023-01-01T12:30:00Z"
   *         createdAt: "2023-01-01T12:30:00Z"
   *         updatedAt: "2023-01-01T12:30:00Z"
   */
  const ScrapedData = sequelize.define('ScrapedData', {
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
    websiteId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Websites',
        key: 'id',
      },
    },
    data: {
      type: DataTypes.JSONB, // Stores the actual scraped content
      allowNull: false,
    },
    scrapedAt: {
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
        fields: ['websiteId']
      },
      {
        fields: ['scrapedAt']
      }
    ]
  });

  ScrapedData.associate = (models) => {
    ScrapedData.belongsTo(models.ScrapingJob, {
      foreignKey: 'jobId',
      as: 'job',
    });
    ScrapedData.belongsTo(models.Website, {
      foreignKey: 'websiteId',
      as: 'website',
    });
  };

  return ScrapedData;
};
```