```javascript
// backend/src/models/website.model.js
module.exports = (sequelize, DataTypes) => {
  /**
   * @swagger
   * components:
   *   schemas:
   *     Website:
   *       type: object
   *       required:
   *         - name
   *         - url
   *       properties:
   *         id:
   *           type: integer
   *           description: The auto-generated ID of the website.
   *           readOnly: true
   *         name:
   *           type: string
   *           description: The name of the website.
   *         url:
   *           type: string
   *           format: url
   *           description: The URL of the website.
   *         description:
   *           type: string
   *           nullable: true
   *           description: A brief description of the website.
   *         createdAt:
   *           type: string
   *           format: date-time
   *           description: The date and time the website was added.
   *           readOnly: true
   *         updatedAt:
   *           type: string
   *           format: date-time
   *           description: The date and time the website was last updated.
   *           readOnly: true
   *       example:
   *         id: 1
   *         name: Example News Site
   *         url: https://example.com/news
   *         description: A site for daily news articles.
   *         createdAt: "2023-01-01T12:00:00Z"
   *         updatedAt: "2023-01-01T12:00:00Z"
   */
  const Website = sequelize.define('Website', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isUrl: true,
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    // Query optimization: Indexes
    indexes: [
      {
        unique: true,
        fields: ['url']
      }
    ]
  });

  Website.associate = (models) => {
    Website.hasMany(models.ScrapingJob, {
      foreignKey: 'websiteId',
      as: 'jobs',
    });
    Website.hasMany(models.ScrapedData, {
      foreignKey: 'websiteId',
      as: 'scrapedData',
    });
  };

  return Website;
};
```