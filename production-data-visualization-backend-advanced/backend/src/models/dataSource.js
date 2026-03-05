const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./user'); // Import User model for association

const DataSource = sequelize.define('DataSource', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: { msg: 'Data source name cannot be empty.' },
    },
  },
  type: {
    type: DataTypes.ENUM('csv_upload', 'api_endpoint', 'database_query', 'mock_data'),
    allowNull: false,
    defaultValue: 'csv_upload',
  },
  config: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
    comment: 'Configuration for data source (e.g., file path, API URL, headers, query)',
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
  },
}, {
  timestamps: true,
});

// Associations
DataSource.belongsTo(User, { foreignKey: 'userId', as: 'owner' });
User.hasMany(DataSource, { foreignKey: 'userId', as: 'dataSources' });

module.exports = DataSource;