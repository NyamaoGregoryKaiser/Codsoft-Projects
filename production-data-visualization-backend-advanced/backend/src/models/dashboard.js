const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./user');
const Chart = require('./chart'); // For associations

const Dashboard = sequelize.define('Dashboard', {
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
      notEmpty: { msg: 'Dashboard name cannot be empty.' },
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  layout: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [], // Array of { i: chartId, x, y, w, h }
    comment: 'Layout configuration for charts on the dashboard',
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
Dashboard.belongsTo(User, { foreignKey: 'userId', as: 'owner' });
User.hasMany(Dashboard, { foreignKey: 'userId', as: 'dashboards' });

// We define a many-to-many relationship through the `layout` JSONB field on Dashboard
// This is a pragmatic choice for simpler layout management, but could be a join table
// Dashboard.belongsToMany(Chart, { through: 'DashboardChart', foreignKey: 'dashboardId', as: 'charts' });
// Chart.belongsToMany(Dashboard, { through: 'DashboardChart', foreignKey: 'chartId', as: 'dashboards' });

module.exports = Dashboard;