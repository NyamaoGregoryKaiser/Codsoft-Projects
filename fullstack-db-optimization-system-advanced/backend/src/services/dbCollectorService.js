const prisma = require('@config/db');
const logger = require('@utils/logger');
const config = require('@config');
const { appCache, delCache } = require('@utils/cache');

// This service simulates collecting data from a database.
// In a real-world scenario, this would connect to an external DB
// using a client like `pg` or `mysql2` and execute monitoring queries
// (e.g., `pg_stat_statements`, `pg_stat_activity`, `information_schema`).

/**
 * Simulates fetching slow queries from the database.
 * For this demo, we're just creating mock data and storing it.
 * In a real app, this would query `pg_stat_statements` or similar.
 */
const collectAndAnalyzeSlowQueries = async (dbInstanceId) => {
  logger.info(`[Collector] Starting slow query collection for instance: ${dbInstanceId}`);
  try {
    // Simulate some "slow" queries happening right now
    const mockQueries = [
      {
        queryText: `SELECT * FROM users WHERE email LIKE '%@example.com%'`,
        durationMs: config.slowQueryThresholdMs + Math.floor(Math.random() * 500),
        occurredAt: new Date(),
        executionPlanText: JSON.stringify({ "Plan": { "Node Type": "Seq Scan", "Relation Name": "users", "Cost": 1234.56, "Rows": 100000 } }),
        hash: `mock_hash_${Date.now()}_1`,
      },
      {
        queryText: `SELECT orders.*, products.name FROM orders JOIN products ON orders.product_id = products.id WHERE orders.status = 'pending'`,
        durationMs: config.slowQueryThresholdMs + Math.floor(Math.random() * 1000),
        occurredAt: new Date(),
        executionPlanText: JSON.stringify({ "Plan": { "Node Type": "Hash Join", "Outer": { "Node Type": "Seq Scan", "Relation Name": "orders" }, "Inner": { "Node Type": "Seq Scan", "Relation Name": "products" } } }),
        hash: `mock_hash_${Date.now()}_2`,
      }
    ];

    for (const mq of mockQueries) {
      // Check if a similar query (by hash) exists recently
      const existingQuery = await prisma.monitoredQuery.findFirst({
        where: {
          hash: mq.hash,
          dbInstanceId,
          occurredAt: {
            gte: new Date(Date.now() - 60 * 60 * 1000) // Within the last hour
          }
        }
      });

      if (existingQuery) {
        logger.debug(`[Collector] Skipping duplicate slow query (hash: ${mq.hash}) for instance: ${dbInstanceId}`);
        continue;
      }

      const monitoredQuery = await prisma.monitoredQuery.create({
        data: {
          dbInstanceId,
          queryText: mq.queryText,
          durationMs: mq.durationMs,
          occurredAt: mq.occurredAt,
          executionPlanText: mq.executionPlanText,
          hash: mq.hash,
        },
      });

      // Also create a simplified explanation for demo purposes
      await prisma.queryExplanation.create({
        data: {
          monitoredQueryId: monitoredQuery.id,
          planType: 'Simulated Scan',
          cost: Math.random() * 10000,
          rows: Math.floor(Math.random() * 100000),
          actualTime: monitoredQuery.durationMs / 1000,
          loops: 1,
          nodeName: 'Root',
          detail: monitoredQuery.executionPlanText ? JSON.parse(monitoredQuery.executionPlanText) : {},
        },
      });
      logger.info(`[Collector] Recorded new slow query (ID: ${monitoredQuery.id}) for instance: ${dbInstanceId}`);
    }

    // After collecting new data, invalidate relevant cache entries
    delCache(`slowQueries:${dbInstanceId}`);
    delCache(`queryExplanations:${dbInstanceId}`);
    // Potentially trigger index suggestion analysis here
    await analyzeForIndexSuggestions(dbInstanceId);
    await analyzeForSchemaIssues(dbInstanceId);


  } catch (error) {
    logger.error(`[Collector] Error collecting slow queries for instance ${dbInstanceId}: ${error.message}`, error);
  }
};

/**
 * Simulates collecting database performance metrics.
 * In a real app, this would query `pg_stat_activity`, `pg_stat_io`, etc.,
 * or use OS-level tools.
 */
const collectDbMetrics = async (dbInstanceId) => {
  logger.info(`[Collector] Starting metric collection for instance: ${dbInstanceId}`);
  try {
    const metric = await prisma.metricSnapshot.create({
      data: {
        dbInstanceId,
        timestamp: new Date(),
        cpuUsage: parseFloat((Math.random() * (90 - 10) + 10).toFixed(2)), // 10-90%
        memoryUsage: parseFloat((Math.random() * (2000 - 500) + 500).toFixed(2)), // 500-2000 MB
        ioOperations: Math.floor(Math.random() * (5000 - 1000) + 1000),
        activeConnections: Math.floor(Math.random() * (100 - 5) + 5),
        idleConnections: Math.floor(Math.random() * (200 - 10) + 10),
        transactionsPerSec: parseFloat((Math.random() * (500 - 50) + 50).toFixed(2)),
        blockReads: Math.floor(Math.random() * (10000 - 100) + 100),
        blockHits: Math.floor(Math.random() * (50000 - 1000) + 1000),
        networkTrafficInMB: parseFloat((Math.random() * (500 - 50) + 50).toFixed(2)),
        networkTrafficOutMB: parseFloat((Math.random() * (500 - 50) + 50).toFixed(2)),
      },
    });
    logger.info(`[Collector] Recorded new metric snapshot (ID: ${metric.id}) for instance: ${dbInstanceId}`);
    delCache(`metrics:${dbInstanceId}`); // Invalidate metrics cache
  } catch (error) {
    logger.error(`[Collector] Error collecting metrics for instance ${dbInstanceId}: ${error.message}`, error);
  }
};

/**
 * Analyzes recent slow queries for index suggestions.
 * In a real app, this would parse `EXPLAIN` plans to find "Seq Scan" on large tables
 * without filters, or `Bitmap Heap Scan` with a large number of rows rechecked.
 */
const analyzeForIndexSuggestions = async (dbInstanceId) => {
  logger.info(`[Collector] Analyzing for index suggestions for instance: ${dbInstanceId}`);
  try {
    const recentQueries = await prisma.monitoredQuery.findMany({
      where: {
        dbInstanceId,
        durationMs: { gte: config.slowQueryThresholdMs },
        occurredAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
      },
      take: 10, // Limit analysis for demo
    });

    for (const query of recentQueries) {
      if (query.executionPlanText && query.executionPlanText.includes("Seq Scan")) {
        const tableNameMatch = query.queryText.match(/FROM\s+(\w+)/i);
        if (tableNameMatch && tableNameMatch[1]) {
          const tableName = tableNameMatch[1];
          const existingSuggestion = await prisma.indexSuggestion.findFirst({
            where: {
              dbInstanceId,
              tableName,
              reason: { contains: 'Seq Scan' },
              status: 'pending',
              createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Check for recent pending suggestion
            }
          });

          if (!existingSuggestion) {
            // Simulate column identification
            const columnMatch = query.queryText.match(/WHERE\s+(\w+)\s*=/i);
            const columns = columnMatch ? [columnMatch[1]] : [`${tableName}_id`]; // Mock a column

            await prisma.indexSuggestion.create({
              data: {
                dbInstanceId,
                tableName,
                columns,
                reason: `Frequent 'Seq Scan' on table '${tableName}' identified by query ID: ${query.id}. Consider indexing columns used in WHERE/ORDER BY clauses.`,
                queryIds: [query.id],
                status: 'pending',
              },
            });
            logger.info(`[Collector] New index suggestion for table '${tableName}' on instance ${dbInstanceId}.`);
          }
        }
      }
    }
    delCache(`indexSuggestions:${dbInstanceId}`); // Invalidate cache
  } catch (error) {
    logger.error(`[Collector] Error analyzing for index suggestions for instance ${dbInstanceId}: ${error.message}`, error);
  }
};


/**
 * Simulates schema issue analysis.
 * In a real app, this would query `information_schema` to check for missing FKs,
 * suboptimal data types, lack of primary keys, etc.
 */
const analyzeForSchemaIssues = async (dbInstanceId) => {
  logger.info(`[Collector] Analyzing for schema issues for instance: ${dbInstanceId}`);
  try {
    const tables = ['users', 'products', 'orders']; // Mock tables

    for (const table of tables) {
      // Simulate missing foreign key
      if (table === 'orders' && Math.random() < 0.5) { // 50% chance
        const existingIssue = await prisma.schemaIssue.findFirst({
          where: {
            dbInstanceId,
            issueType: 'MissingForeignKey',
            objectName: table,
            status: 'open',
            createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
          }
        });
        if (!existingIssue) {
          await prisma.schemaIssue.create({
            data: {
              dbInstanceId,
              issueType: 'MissingForeignKey',
              description: `Table '${table}' might be missing a foreign key constraint for 'product_id' referencing 'products.id'.`,
              objectName: table,
              severity: 'high',
              status: 'open',
            },
          });
          logger.info(`[Collector] New schema issue: Missing FK on table '${table}' for instance ${dbInstanceId}.`);
        }
      }

      // Simulate suboptimal data type
      if (table === 'users' && Math.random() < 0.3) { // 30% chance
        const existingIssue = await prisma.schemaIssue.findFirst({
          where: {
            dbInstanceId,
            issueType: 'SuboptimalDataType',
            objectName: table,
            status: 'open',
            createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
          }
        });
        if (!existingIssue) {
          await prisma.schemaIssue.create({
            data: {
              dbInstanceId,
              issueType: 'SuboptimalDataType',
              description: `Column 'user_status' in table '${table}' is of type TEXT, but could be ENUM or smallint for better performance.`,
              objectName: table,
              severity: 'medium',
              status: 'open',
            },
          });
          logger.info(`[Collector] New schema issue: Suboptimal data type on table '${table}' for instance ${dbInstanceId}.`);
        }
      }
    }
    delCache(`schemaIssues:${dbInstanceId}`); // Invalidate cache
  } catch (error) {
    logger.error(`[Collector] Error analyzing for schema issues for instance ${dbInstanceId}: ${error.message}`, error);
  }
};


/**
 * Main collection function to be scheduled.
 * Iterates through all monitored database instances and runs collectors.
 */
const runAllCollectors = async () => {
  logger.info('[Collector] Running all scheduled data collection tasks...');
  try {
    const dbInstances = await prisma.dbInstance.findMany();

    if (dbInstances.length === 0) {
      logger.warn('[Collector] No database instances configured to monitor.');
      return;
    }

    for (const instance of dbInstances) {
      logger.info(`[Collector] Processing DbInstance: ${instance.name} (ID: ${instance.id})`);
      await collectAndAnalyzeSlowQueries(instance.id);
      await collectDbMetrics(instance.id);
      // Other collectors can be added here
    }
    logger.info('[Collector] All scheduled data collection tasks completed.');
  } catch (error) {
    logger.error(`[Collector] Global error during collector run: ${error.message}`, error);
  }
};


module.exports = {
  collectAndAnalyzeSlowQueries,
  collectDbMetrics,
  analyzeForIndexSuggestions,
  analyzeForSchemaIssues,
  runAllCollectors,
};