```javascript
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ContentItem extends Model {
    static associate(models) {
      // Each ContentItem belongs to one ContentType
      ContentItem.belongsTo(models.ContentType, { foreignKey: 'contentTypeId', as: 'ContentType' });
      // Each ContentItem has an author
      ContentItem.belongsTo(models.User, { foreignKey: 'authorId', as: 'Author' });
      // Each ContentItem might have been updated by a user
      ContentItem.belongsTo(models.User, { foreignKey: 'updatedBy', as: 'Updater' });
      // Optionally, ContentItems can have revisions or versions if implemented
      // ContentItem.hasMany(models.ContentRevision, { foreignKey: 'contentItemId', as: 'Revisions' });
    }
  }

  ContentItem.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    contentTypeId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'ContentTypes', // Refers to table name
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE', // If a content type is deleted, its content items are also deleted
    },
    // This is where the actual content data is stored as a JSON object
    // Its structure is defined by the associated ContentType's `fields` attribute
    data: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    status: {
      type: DataTypes.ENUM('draft', 'published', 'archived', 'pending_review'),
      defaultValue: 'draft',
      allowNull: false,
    },
    authorId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users', // Refers to table name
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL', // If an author is deleted, content items remain but authorId is null
    },
    updatedBy: {
      type: DataTypes.UUID,
      allowNull: true, // Can be null if updated by system or initial creation
      references: {
        model: 'Users', // Refers to table name
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    publishedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // Optional: for versioning/revisions
    // version: {
    //   type: DataTypes.INTEGER,
    //   defaultValue: 1,
    //   allowNull: false,
    // }
  }, {
    sequelize,
    modelName: 'ContentItem',
    tableName: 'ContentItems',
    timestamps: true,
    hooks: {
      beforeUpdate: (contentItem, options) => {
        if (contentItem.status === 'published' && !contentItem.publishedAt) {
          contentItem.publishedAt = new Date();
        } else if (contentItem.status !== 'published' && contentItem.publishedAt) {
          // If status changes from published, clear publishedAt or handle as desired
          // contentItem.publishedAt = null;
        }
      }
    },
  });

  return ContentItem;
};
```