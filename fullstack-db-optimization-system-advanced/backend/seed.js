const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { faker } = require('@faker-js/faker');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create Admin User
  const hashedPassword = await bcrypt.hash('adminpassword', 10);
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      role: 'admin',
    },
  });
  console.log(`Created admin user: ${adminUser.username}`);

  // Create a default DbInstance (representing the system's own DB)
  const dbInstance = await prisma.dbInstance.upsert({
    where: { name: 'LocalOptimizerDB' },
    update: {},
    create: {
      name: 'LocalOptimizerDB',
      type: 'PostgreSQL',
      host: 'localhost',
      port: 5432,
      database: 'optimizer_db',
      username: 'postgres',
      // password: 'your_db_password', // For demo, we might omit or keep it simple
    },
  });
  console.log(`Created DbInstance: ${dbInstance.name}`);

  // Simulate Slow Queries and Explanations
  const numQueries = 10;
  const slowQueries = [];
  for (let i = 0; i < numQueries; i++) {
    const queryText = `SELECT * FROM ${faker.database.tableName()} WHERE ${faker.database.column()} = '${faker.string.uuid()}' ORDER BY ${faker.database.column()} LIMIT ${faker.number.int({ min: 10, max: 100 })}`;
    const durationMs = faker.number.int({ min: 100, max: 5000 });
    const occurredAt = faker.date.recent({ days: 30 });

    const query = await prisma.monitoredQuery.create({
      data: {
        dbInstanceId: dbInstance.id,
        queryText: queryText,
        durationMs: durationMs,
        occurredAt: occurredAt,
        hash: faker.string.uuid(), // Unique hash for demo
        executionPlanText: JSON.stringify({
          "Plan": {
            "Node Type": faker.helpers.arrayElement(["Seq Scan", "Index Scan", "Hash Join"]),
            "Actual Time": faker.number.float({ min: 0.1, max: durationMs / 1000 }),
            "Actual Rows": faker.number.int({ min: 1, max: 1000 }),
            "Actual Loops": faker.number.int({ min: 1, max: 5 }),
            "Total Cost": faker.number.float({ min: 10, max: 10000 }),
            "Startup Cost": faker.number.float({ min: 0.1, max: 100 }),
            "Plan Rows": faker.number.int({ min: 1, max: 2000 }),
            "Plan Width": faker.number.int({ min: 16, max: 256 }),
            "Relation Name": faker.database.tableName(),
            "Alias": "t1",
            "Filter": faker.helpers.arrayElement([`${faker.database.column()} = 'value'`, null]),
            "Index Name": faker.helpers.arrayElement([`${faker.string.alpha(5)}_idx`, null]),
            "Index Cond": faker.helpers.arrayElement([`("${faker.database.column()}" = 'value')`, null]),
            "Workers Planned": faker.helpers.arrayElement([1, 2, null]),
            "Workers Launched": faker.helpers.arrayElement([1, 2, null]),
            "Shared Hit Blocks": faker.number.int({ min: 10, max: 500 }),
            "Shared Read Blocks": faker.number.int({ min: 0, max: 100 }),
            "Shared Dirtied Blocks": faker.number.int({ min: 0, max: 10 }),
            "Shared Written Blocks": faker.number.int({ min: 0, max: 5 }),
            "Temp Read Blocks": faker.number.int({ min: 0, max: 20 }),
            "Temp Written Blocks": faker.number.int({ min: 0, max: 10 }),
            "Walked Tables": [
                {
                    "table_name": faker.database.tableName(),
                    "total_rows": faker.number.int({ min: 1000, max: 100000 })
                }
            ],
            "JIT": {
              "Functions": faker.number.int({ min: 1, max: 10 }),
              "Generation Time": faker.number.float({ min: 0.01, max: 0.5 }),
              "Inlining Time": faker.number.float({ min: 0.01, max: 0.2 }),
              "Optimization Time": faker.number.float({ min: 0.01, max: 0.3 }),
              "Emission Time": faker.number.float({ min: 0.01, max: 0.1 })
            },
            "Plans": [
                {
                    "Node Type": faker.helpers.arrayElement(["Bitmap Heap Scan", "Index Only Scan"]),
                    "Parent Relationship": "Outer",
                    "Actual Time": faker.number.float({ min: 0.1, max: durationMs / 1000 / 2 }),
                    "Actual Rows": faker.number.int({ min: 1, max: 500 }),
                    "Actual Loops": faker.number.int({ min: 1, max: 2 }),
                    "Total Cost": faker.number.float({ min: 5, max: 5000 }),
                    "Startup Cost": faker.number.float({ min: 0.1, max: 50 }),
                    "Plan Rows": faker.number.int({ min: 1, max: 1000 }),
                    "Plan Width": faker.number.int({ min: 16, max: 128 }),
                    "Relation Name": faker.database.tableName(),
                    "Alias": "t2",
                    "Index Name": faker.string.alpha(5) + "_idx",
                    "Bitmap Index Scan": {
                        "Node Type": "Bitmap Index Scan",
                        "Parent Relationship": "Inner",
                        "Actual Time": faker.number.float({ min: 0.01, max: durationMs / 1000 / 4 }),
                        "Actual Rows": faker.number.int({ min: 1, max: 250 }),
                        "Actual Loops": faker.number.int({ min: 1, max: 2 }),
                        "Total Cost": faker.number.float({ min: 1, max: 2500 }),
                        "Startup Cost": faker.number.float({ min: 0.01, max: 25 }),
                        "Plan Rows": faker.number.int({ min: 1, max: 500 }),
                        "Plan Width": 0,
                        "Index Name": faker.string.alpha(5) + "_idx",
                        "Index Cond": `("${faker.database.column()}" = 'value')`
                    }
                }
            ]
          }
        }),
      },
    });
    slowQueries.push(query);

    // Create a QueryExplanation for each slow query
    await prisma.queryExplanation.create({
      data: {
        monitoredQueryId: query.id,
        planType: 'Seq Scan', // Simplified for seeding
        cost: faker.number.float({ min: 100, max: 10000 }),
        rows: faker.number.int({ min: 1000, max: 100000 }),
        actualTime: query.durationMs / 1000,
        loops: 1,
        nodeName: 'Table Scan',
        detail: { 'Scan Type': 'Full Table Scan' },
      },
    });
  }
  console.log(`Created ${numQueries} slow queries and explanations.`);

  // Simulate Index Suggestions
  const numSuggestions = 3;
  for (let i = 0; i < numSuggestions; i++) {
    await prisma.indexSuggestion.create({
      data: {
        dbInstanceId: dbInstance.id,
        tableName: faker.database.tableName(),
        columns: [faker.database.column(), faker.database.column()],
        reason: `Frequently filtered by ${faker.database.column()} in slow queries.`,
        queryIds: faker.helpers.arrayElements(slowQueries.map(q => q.id), { min: 1, max: 3 }),
        status: faker.helpers.arrayElement(['pending', 'dismissed']),
      },
    });
  }
  console.log(`Created ${numSuggestions} index suggestions.`);

  // Simulate Schema Issues
  const numSchemaIssues = 2;
  for (let i = 0; i < numSchemaIssues; i++) {
    await prisma.schemaIssue.create({
      data: {
        dbInstanceId: dbInstance.id,
        issueType: faker.helpers.arrayElement(['MissingForeignKey', 'SuboptimalDataType', 'MissingIndex']),
        description: `Table '${faker.database.tableName()}' is missing a foreign key constraint on column '${faker.database.column()}'.`,
        objectName: faker.database.tableName(),
        severity: faker.helpers.arrayElement(['low', 'medium', 'high']),
        status: faker.helpers.arrayElement(['open', 'resolved']),
      },
    });
  }
  console.log(`Created ${numSchemaIssues} schema issues.`);

  // Simulate Metric Snapshots
  const numSnapshots = 24; // 24 hours of data
  for (let i = 0; i < numSnapshots; i++) {
    await prisma.metricSnapshot.create({
      data: {
        dbInstanceId: dbInstance.id,
        timestamp: faker.date.recent({ days: 1, refDate: new Date(Date.now() - i * 3600 * 1000) }), // hourly snapshots
        cpuUsage: faker.number.float({ min: 10, max: 90, precision: 0.1 }),
        memoryUsage: faker.number.float({ min: 200, max: 1000, precision: 0.1 }),
        ioOperations: faker.number.int({ min: 500, max: 5000 }),
        activeConnections: faker.number.int({ min: 5, max: 50 }),
        idleConnections: faker.number.int({ min: 10, max: 100 }),
        transactionsPerSec: faker.number.float({ min: 10, max: 200, precision: 0.1 }),
        blockReads: faker.number.int({ min: 100, max: 10000 }),
        blockHits: faker.number.int({ min: 5000, max: 50000 }),
      },
    });
  }
  console.log(`Created ${numSnapshots} metric snapshots.`);

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });