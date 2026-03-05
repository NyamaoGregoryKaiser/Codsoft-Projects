const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./user');
const DataSource = require('./dataSource');

const Chart = sequelize.define('Chart', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Chart name cannot be empty.' },
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  type: {
    type: DataTypes.ENUM('bar', 'line', 'pie', 'area', 'scatter', 'table'),
    allowNull: false,
    defaultValue: 'bar',
  },
  config: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
    comment: 'Echarts configuration for the chart',
  },
  dataSourceId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: DataSource,
      key: 'id',
    },
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
Chart.belongsTo(User, { foreignKey: 'userId', as: 'owner' });
Chart.belongsTo(DataSource, { foreignKey: 'dataSourceId', as: 'dataSource' });

User.hasMany(Chart, { foreignKey: 'userId', as: 'charts' });
DataSource.hasMany(Chart, { foreignKey: 'dataSourceId', as: 'charts' });

module.exports = Chart;