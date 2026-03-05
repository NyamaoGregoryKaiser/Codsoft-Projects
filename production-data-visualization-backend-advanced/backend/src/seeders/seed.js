const sequelize = require('../config/database');
const { User, DataSource, Chart, Dashboard } = require('../models');
const { faker } = require('@faker-js/faker');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

const seed = async () => {
  try {
    // Clear existing data (optional, useful for clean re-seeding)
    await Dashboard.destroy({ truncate: { cascade: true } });
    await Chart.destroy({ truncate: { cascade: true } });
    await DataSource.destroy({ truncate: { cascade: true } });
    await User.destroy({ truncate: { cascade: true } });

    logger.info('Database cleared. Starting seeding...');

    // Create users
    const adminPassword = await bcrypt.hash('admin123', 12);
    const userPassword = await bcrypt.hash('user123', 12);

    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: adminPassword,
      role: 'admin',
    });

    const regularUser = await User.create({
      username: 'user',
      email: 'user@example.com',
      password: userPassword,
      role: 'user',
    });

    logger.info('Users created.');

    // Create data sources for regular user
    const salesDataSource = await DataSource.create({
      name: 'Monthly Sales Data',
      type: 'mock_data',
      config: {
        data: Array.from({ length: 12 }, (_, i) => ({
          month: new Date(0, i).toLocaleString('en', { month: 'short' }),
          sales: faker.number.int({ min: 100, max: 1000 }),
          profit: faker.number.int({ min: 20, max: 300 }),
        })),
        columns: ['month', 'sales', 'profit'],
        description: 'Mock data for monthly sales and profit.'
      },
      userId: regularUser.id,
    });

    const productDataSource = await DataSource.create({
      name: 'Product Categories',
      type: 'mock_data',
      config: {
        data: [
          { category: 'Electronics', count: 400, revenue: 1200000 },
          { category: 'Clothing', count: 600, revenue: 800000 },
          { category: 'Home Goods', count: 350, revenue: 600000 },
          { category: 'Books', count: 700, revenue: 300000 },
          { category: 'Sports', count: 250, revenue: 450000 },
        ],
        columns: ['category', 'count', 'revenue'],
        description: 'Mock data for product categories.'
      },
      userId: regularUser.id,
    });

    logger.info('Data sources created.');

    // Create charts for regular user
    const salesBarChart = await Chart.create({
      name: 'Monthly Sales Bar Chart',
      description: 'Bar chart showing monthly sales.',
      type: 'bar',
      config: {
        title: { text: 'Monthly Sales' },
        tooltip: {},
        legend: { data: ['Sales'] },
        xAxis: { type: 'category', data: salesDataSource.config.data.map(d => d.month) },
        yAxis: { type: 'value' },
        series: [{
          name: 'Sales',
          type: 'bar',
          data: salesDataSource.config.data.map(d => d.sales)
        }]
      },
      dataSourceId: salesDataSource.id,
      userId: regularUser.id,
    });

    const profitLineChart = await Chart.create({
      name: 'Monthly Profit Line Chart',
      description: 'Line chart showing monthly profit trends.',
      type: 'line',
      config: {
        title: { text: 'Monthly Profit Trend' },
        tooltip: { trigger: 'axis' },
        legend: { data: ['Profit'] },
        xAxis: { type: 'category', data: salesDataSource.config.data.map(d => d.month) },
        yAxis: { type: 'value' },
        series: [{
          name: 'Profit',
          type: 'line',
          data: salesDataSource.config.data.map(d => d.profit),
          smooth: true
        }]
      },
      dataSourceId: salesDataSource.id,
      userId: regularUser.id,
    });

    const categoryPieChart = await Chart.create({
      name: 'Product Category Revenue Pie Chart',
      description: 'Pie chart showing revenue distribution by product category.',
      type: 'pie',
      config: {
        title: { text: 'Revenue by Category', left: 'center' },
        tooltip: { trigger: 'item', formatter: '{a} <br/>{b}: {c} ({d}%)' },
        legend: { orient: 'vertical', left: 'left', data: productDataSource.config.data.map(d => d.category) },
        series: [{
          name: 'Revenue',
          type: 'pie',
          radius: '50%',
          data: productDataSource.config.data.map(d => ({ value: d.revenue, name: d.category })),
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }]
      },
      dataSourceId: productDataSource.id,
      userId: regularUser.id,
    });

    logger.info('Charts created.');

    // Create a dashboard for regular user
    await Dashboard.create({
      name: 'Sales Overview Dashboard',
      description: 'A dashboard providing an overview of sales and profit data.',
      layout: [
        { i: salesBarChart.id, x: 0, y: 0, w: 6, h: 6 },
        { i: profitLineChart.id, x: 6, y: 0, w: 6, h: 6 },
        { i: categoryPieChart.id, x: 0, y: 6, w: 12, h: 8 },
      ],
      userId: regularUser.id,
    });

    logger.info('Dashboard created.');

    logger.info('Seeding complete!');
  } catch (error) {
    logger.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    logger.info('Database connection closed.');
  }
};

// Ensure all models are loaded and associated before syncing/seeding
require('../models');

sequelize.sync({ force: true }) // WARNING: `force: true` drops existing tables! Use `sequelize db:migrate` in production.
  .then(() => seed())
  .catch(err => {
    logger.error('Error syncing database before seeding:', err);
    process.exit(1);
  });