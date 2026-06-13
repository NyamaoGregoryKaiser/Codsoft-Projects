module.exports = (sequelize, DataTypes) => {
  const Media = sequelize.define('Media', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    filename: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: { msg: 'Filename cannot be empty.' },
      },
    },
    originalname: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Original name cannot be empty.' },
      },
    },
    mimetype: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    size: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: { args: 0, msg: 'File size must be positive.' },
      },
    },
    filepath: { // Relative path or URL
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    uploadedBy: {
      type: DataTypes.UUID,
      allowNull: true, // Can be null if uploaded by system or anonymous
      references: {
        model: 'users',
        key: 'id',
      },
    },
  }, {
    tableName: 'media',
    timestamps: true,
  });

  Media.associate = (models) => {
    Media.belongsTo(models.User, { foreignKey: 'uploadedBy', as: 'uploader' });
    Media.hasMany(models.Post, { foreignKey: 'featuredImageId', as: 'featuredInPosts' });
  };

  return Media;
};