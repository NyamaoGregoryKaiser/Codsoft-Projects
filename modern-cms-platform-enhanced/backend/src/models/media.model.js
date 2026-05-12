```javascript
module.exports = (sequelize, DataTypes) => {
  const Media = sequelize.define('Media', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: { msg: 'Media name is required' },
        notEmpty: { msg: 'Media name cannot be empty' },
      }
    },
    filename: { // The actual filename stored
      type: DataTypes.STRING,
      allowNull: false,
      unique: true, // Should be unique
    },
    path: { // URL or path to access the media
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isUrl: { msg: 'Path must be a valid URL' } // Assuming external storage like S3 or local static serve
      }
    },
    mimeType: {
      type: DataTypes.STRING,
      allowNull: false
    },
    size: { // Size in bytes
      type: DataTypes.INTEGER,
      allowNull: false
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'media',
    timestamps: true
  });

  Media.associate = (models) => {
    Media.belongsTo(models.User, { foreignKey: 'userId', as: 'uploader' });
  };

  return Media;
};
```