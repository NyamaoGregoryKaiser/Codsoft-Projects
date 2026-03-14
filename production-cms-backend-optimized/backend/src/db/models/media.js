```javascript
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Media extends Model {
    static associate(models) {
      // Each Media item is uploaded by one User
      Media.belongsTo(models.User, { foreignKey: 'uploadedBy', as: 'Uploader' });
      // Media items could be linked to ContentItems if needed, e.g., through a many-to-many
      // Media.belongsToMany(models.ContentItem, {
      //   through: 'ContentItemMedia',
      //   foreignKey: 'mediaId',
      //   otherKey: 'contentItemId',
      //   as: 'ContentItems'
      // });
    }
  }

  Media.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    filename: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    originalName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    mimetype: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    size: {
      type: DataTypes.INTEGER, // Size in bytes
      allowNull: false,
    },
    path: {
      type: DataTypes.STRING, // Path to the stored file
      allowNull: false,
    },
    url: {
      type: DataTypes.STRING, // Public URL to access the file
      allowNull: false,
    },
    uploadedBy: {
      type: DataTypes.UUID,
      allowNull: true, // Can be null if uploaded by system or anonymous
      references: {
        model: 'Users', // Refers to table name
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL', // If uploader is deleted, media remains
    },
    altText: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: 'Media',
    tableName: 'Media',
    timestamps: true,
  });

  return Media;
};
```