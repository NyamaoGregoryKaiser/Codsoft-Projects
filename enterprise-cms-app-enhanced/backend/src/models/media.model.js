const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');
const config = require('../config/config');

const Media = sequelize.define('Media', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  fileName: {
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
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  filePath: {
    type: DataTypes.STRING,
    allowNull: false,
    get() {
      // Prepend base URL for accessibility
      const rawValue = this.getDataValue('filePath');
      if (rawValue) {
        return `${config.frontendUrl}/uploads/${rawValue}`; // Adjust base URL as needed
      }
      return rawValue;
    }
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id',
    }
  }
}, {
  timestamps: true,
});

module.exports = Media;