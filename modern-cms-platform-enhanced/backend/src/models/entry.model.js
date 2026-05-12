```javascript
module.exports = (sequelize, DataTypes) => {
  const Entry = sequelize.define('Entry', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    contentTypeId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'content_types',
        key: 'id'
      }
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('draft', 'published', 'archived'),
      defaultValue: 'draft',
      allowNull: false
    },
    // Dynamic content data based on ContentType's fields
    data: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    }
  }, {
    tableName: 'entries',
    timestamps: true,
    indexes: [
      {
        fields: ['contentTypeId']
      },
      {
        fields: ['userId']
      },
      {
        fields: ['status']
      }
    ]
  });

  Entry.associate = (models) => {
    Entry.belongsTo(models.ContentType, { foreignKey: 'contentTypeId', as: 'contentType' });
    Entry.belongsTo(models.User, { foreignKey: 'userId', as: 'author' });
  };

  return Entry;
};
```