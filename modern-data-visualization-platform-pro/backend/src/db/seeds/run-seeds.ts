import 'reflect-metadata';
import { AppDataSource } from '../data-source';
import { UserService } from '../../services/UserService';
import { DatasetService } from '../../services/DatasetService';
import { DashboardService } from '../../services/DashboardService';
import { VisualizationService } from '../../services/VisualizationService';
import { ChartType } from '../../models/Visualization';
import logger from '../../config/logger';

/**
 * Script to run seed data into the database.
 * This should be used for development or testing environments.
 */
const runSeeds = async () => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      logger.info('Database connection initialized for seeding.');
    } else {
      logger.info('Database connection already initialized.');
    }

    const userService = new UserService();
    const datasetService = new DatasetService();
    const dashboardService = new DashboardService();
    const visualizationService = new VisualizationService();

    logger.info('Starting database seeding...');

    // 1. Create Users
    const user1 = await userService.registerUser('john_doe', 'john.doe@example.com', 'password123');
    const user2 = await userService.registerUser('jane_smith', 'jane.smith@example.com', 'securepass');
    logger.info('Created sample users.');

    // 2. Create Datasets for User 1
    const salesData = [
      { product: 'Laptop', region: 'North', sales: 12000, units: 120 },
      { product: 'Mouse', region: 'North', sales: 1500, units: 300 },
      { product: 'Keyboard', region: 'South', sales: 2000, units: 200 },
      { product: 'Laptop', region: 'South', sales: 15000, units: 150 },
      { product: 'Monitor', region: 'East', sales: 8000, units: 80 },
      { product: 'Mouse', region: 'East', sales: 1000, units: 250 },
      { product: 'Keyboard', region: 'West', sales: 3000, units: 300 },
      { product: 'Monitor', region: 'West', sales: 10000, units: 100 },
    ];
    const salesDataset = await datasetService.createDataset(
      user1.id,
      'Monthly Sales Data',
      'Sales performance across products and regions.',
      salesData
    );

    const populationData = [
      { country: 'USA', population: 331, year: 2020 },
      { country: 'India', population: 1380, year: 2020 },
      { country: 'China', population: 1440, year: 2020 },
      { country: 'USA', population: 334, year: 2022 },
      { country: 'India', population: 1400, year: 2022 },
      { country: 'China', population: 1420, year: 2022 },
    ];
    const populationDataset = await datasetService.createDataset(
      user1.id,
      'Global Population',
      'Population data by country over years.',
      populationData
    );
    logger.info('Created sample datasets for user 1.');

    // 3. Create Dashboards for User 1
    const salesDashboard = await dashboardService.createDashboard(
      user1.id,
      'Sales Overview',
      'Key metrics and trends for product sales.'
    );
    const globalDashboard = await dashboardService.createDashboard(
      user1.id,
      'Global Insights',
      'Demographic and economic data.'
    );
    logger.info('Created sample dashboards for user 1.');


    // 4. Create Visualizations for User 1
    // Bar Chart: Sales by Product
    const salesByProductViz = await visualizationService.createVisualization(
      user1.id,
      'Sales by Product (Bar)',
      'Total sales grouped by product.',
      ChartType.Bar,
      salesDataset.id,
      salesDashboard.id,
      {
        xAxis: { field: 'product', label: 'Product' },
        yAxis: { field: 'sales', label: 'Total Sales' },
        backgroundColor: ['#42A5F5', '#66BB6A', '#FFA726', '#EF5350'],
      }
    );

    // Line Chart: Units by Region
    const unitsByRegionViz = await visualizationService.createVisualization(
      user1.id,
      'Units Sold by Region (Line)',
      'Total units sold per region.',
      ChartType.Line,
      salesDataset.id,
      salesDashboard.id,
      {
        xAxis: { field: 'region', label: 'Region' },
        yAxis: { field: 'units', label: 'Total Units Sold' },
        borderColor: '#AB47BC',
        backgroundColor: 'rgba(171, 71, 188, 0.2)',
      }
    );

    // Pie Chart: Sales Distribution by Region
    const salesDistributionViz = await visualizationService.createVisualization(
      user1.id,
      'Sales Distribution (Pie)',
      'Percentage of total sales by region.',
      ChartType.Pie,
      salesDataset.id,
      salesDashboard.id,
      {
        labelField: 'region',
        valueField: 'sales',
        backgroundColor: ['#E91E63', '#00BCD4', '#FFEB3B', '#8BC34A'],
      }
    );

    // Table Viz: Latest Population Data (Standalone)
    const populationTableViz = await visualizationService.createVisualization(
      user1.id,
      'Latest Population Data',
      'Raw population data by country and year.',
      ChartType.Table,
      populationDataset.id,
      null, // This is a standalone visualization
      {
        columns: ['country', 'year', 'population'],
        limit: 5,
      }
    );
    logger.info('Created sample visualizations for user 1 and assigned to dashboards.');

    logger.info('Database seeding completed successfully!');
  } catch (error) {
    logger.error('Error during database seeding:', error);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      logger.info('Database connection closed.');
    }
  }
};

runSeeds();