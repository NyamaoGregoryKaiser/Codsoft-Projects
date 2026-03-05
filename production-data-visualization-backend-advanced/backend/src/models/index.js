const User = require('./user');
const DataSource = require('./dataSource');
const Chart = require('./chart');
const Dashboard = require('./dashboard');

// All model associations are defined within their respective model files
// Example: User.hasMany(DataSource), DataSource.belongsTo(User)

module.exports = {
  User,
  DataSource,
  Chart,
  Dashboard,
};