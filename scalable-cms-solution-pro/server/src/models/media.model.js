```javascript
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const Media = sequelize.define(
    'Media',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: () => uuidv4(),
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
      mimeType: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      size: {
        type: DataTypes.INTEGER, // in bytes
        allowNull: false,
      },
      path: {
        type: DataTypes.STRING, // relative path from /uploads directory
        allowNull: false,
      },
      uploadedBy: {
        type: DataTypes.UUID,
        allowNull: true, // Can be null if uploader is deleted
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      // Timestamps
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'media',
      timestamps: true,
      underscored: true,
    }
  );

  Media.associate = (models) => {
    Media.belongsTo(models.User, {
      foreignKey: 'uploadedBy',
      as: 'uploader',
    });
  };

  return Media;
};
```