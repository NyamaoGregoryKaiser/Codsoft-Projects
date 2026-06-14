```typescript
// backend/prisma/seed.ts
import { PrismaClient, UserRole, DataSourceType, ChartType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create Admin User
  const adminPassword = await bcrypt.hash('adminpassword', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      username: 'adminuser',
      password: adminPassword,
      role: UserRole.ADMIN,
    },
  });
  console.log(`Created admin user: ${adminUser.email}`);

  // Create Regular User
  const userPassword = await bcrypt.hash('userpassword', 10);
  const regularUser = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      username: 'regularuser',
      password: userPassword,
      role: UserRole.USER,
    },
  });
  console.log(`Created regular user: ${regularUser.email}`);

  // Create a Sample PostgreSQL Data Source
  const postgresDataSource = await prisma.dataSource.upsert({
    where: { id: 'sample-postgres-ds' }, // Use a fixed ID for seeding
    update: {},
    create: {
      id: 'sample-postgres-ds',
      name: 'Sample PostgreSQL Database',
      type: DataSourceType.POSTGRES,
      config: {
        host: 'localhost', // Replace with actual DB host in production
        port: 5432,
        user: 'postgres',
        password: 'password',
        database: 'analytics_db',
      },
      userId: adminUser.id,
      description: 'A sample PostgreSQL database for demo purposes.',
    },
  });
  console.log(`Created data source: ${postgresDataSource.name}`);

  // Create a Sample Chart using the PostgreSQL Data Source
  const sampleChart = await prisma.chart.upsert({
    where: { id: 'sample-bar-chart' },
    update: {},
    create: {
      id: 'sample-bar-chart',
      name: 'Sales by Product Category',
      description: 'Monthly sales data for different product categories.',
      chartType: ChartType.BAR,
      dataQuery: 'SELECT category, SUM(sales) as total_sales FROM products GROUP BY category ORDER BY total_sales DESC LIMIT 5;',
      config: {
        title: { text: 'Monthly Sales' },
        tooltip: {},
        legend: { data: ['Sales'] },
        xAxis: { type: 'category', data: ['Category A', 'Category B', 'Category C', 'Category D', 'Category E'] },
        yAxis: { type: 'value' },
        series: [{ name: 'Sales', type: 'bar', data: [150, 230, 224, 218, 135] }]
      },
      dataSourceId: postgresDataSource.id,
      userId: adminUser.id,
    },
  });
  console.log(`Created chart: ${sampleChart.name}`);

  // Create a Sample Dashboard
  const sampleDashboard = await prisma.dashboard.upsert({
    where: { id: 'sample-dashboard' },
    update: {},
    create: {
      id: 'sample-dashboard',
      name: 'Executive Sales Dashboard',
      description: 'An overview of key sales metrics.',
      userId: adminUser.id,
    },
  });
  console.log(`Created dashboard: ${sampleDashboard.name}`);

  // Add the Chart to the Dashboard as a Panel
  await prisma.dashboardPanel.upsert({
    where: { id: 'sample-panel-1' },
    update: {},
    create: {
      id: 'sample-panel-1',
      dashboardId: sampleDashboard.id,
      chartId: sampleChart.id,
      layout: { x: 0, y: 0, w: 6, h: 8 }, // react-grid-layout format
    },
  });
  console.log(`Added chart "${sampleChart.name}" to dashboard "${sampleDashboard.name}"`);

  console.log('Database seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```