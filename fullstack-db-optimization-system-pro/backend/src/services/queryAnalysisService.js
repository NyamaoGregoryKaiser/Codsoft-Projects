```javascript
const { Sequelize } = require('sequelize');
const { SlowQuery, QueryPlan, Database, Optimization } = require('../models');
const logger = require('../utils/logger');
const redisClient = require('../config/redis');

// Cache key for query analysis results
const CACHE_TTL = 60 * 15; // 15 minutes

class QueryAnalysisService {
  /**
   * Connects to a target database using provided credentials.
   * @param {Object} dbConfig - Database connection configuration
   * @returns {Sequelize} - Sequelize instance connected to the target DB
   */
  async getTargetDbConnection(dbConfig) {
    try {
      // Basic validation
      if (!dbConfig || !dbConfig.dialect || !dbConfig.host || !dbConfig.database || !dbConfig.username) {
        throw new Error('Invalid database configuration provided.');
      }

      // Note: This is a simplified direct connection. In a real app,
      // you might use a connection pool manager for multiple target databases.
      const targetSequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
        host: dbConfig.host,
        port: dbConfig.port || 5432, // Default to PostgreSQL port
        dialect: dbConfig.dialect, // e.g., 'postgres'
        logging: false, // Suppress logging for target DB queries
        define: {
          freezeTableName: true,
        },
        dialectOptions: {
          ssl: dbConfig.ssl ? {
            require: true,
            rejectUnauthorized: false // Adjust based on your SSL certificate setup
          } : false
        }
      });
      await targetSequelize.authenticate();
      return targetSequelize;
    } catch (error) {
      logger.error(`Failed to connect to target database ${dbConfig.database} at ${dbConfig.host}: ${error.message}`);
      throw new Error(`Could not connect to target database: ${error.message}`);
    }
  }

  /**
   * Fetches slow queries from a target PostgreSQL database.
   * This is a simplified example. Real monitoring systems would parse logs or pg_stat_statements.
   * For this example, we'll simulate fetching some queries that *might* be slow.
   * @param {number} databaseId - The ID of the registered database
   * @returns {Array<Object>} - List of potential slow queries
   */
  async fetchSlowQueries(databaseId) {
    const cacheKey = `slow_queries:${databaseId}`;
    let cachedQueries = await redisClient.get(cacheKey);

    if (cachedQueries) {
      logger.info(`Serving slow queries for database ${databaseId} from cache.`);
      return JSON.parse(cachedQueries);
    }

    const dbRecord = await Database.findByPk(databaseId);
    if (!dbRecord) {
      throw new Error('Database not found.');
    }

    const { host, port, dbName, username, password, ssl } = dbRecord;
    const targetDbConfig = { host, port, database: dbName, username, password, dialect: 'postgres', ssl };

    let targetSequelize;
    try {
      targetSequelize = await this.getTargetDbConnection(targetDbConfig);

      // --- SIMULATED SLOW QUERY FETCH ---
      // In a real scenario, you'd query pg_stat_statements or parse logs.
      // For demonstration, let's assume we have a way to identify "problematic" queries.
      const simulatedQueries = [
        {
          query_text: "SELECT * FROM users WHERE created_at < '2023-01-01' ORDER BY email DESC;",
          estimated_cost: 1500,
          call_count: 100,
          avg_duration_ms: 500
        },
        {
          query_text: "SELECT p.name, c.category_name FROM products p JOIN categories c ON p.category_id = c.id WHERE p.price > 100 AND c.category_name ILIKE '%electronics%';",
          estimated_cost: 2500,
          call_count: 50,
          avg_duration_ms: 800
        },
        {
          query_text: "SELECT o.id, u.username FROM orders o LEFT JOIN users u ON o.user_id = u.id WHERE o.status = 'pending' AND u.email IS NULL;",
          estimated_cost: 800,
          call_count: 200,
          avg_duration_ms: 300
        }
      ];

      // Store fetched slow queries in our system's DB for historical tracking
      const createdSlowQueries = [];
      for (const sq of simulatedQueries) {
        const [slowQuery, created] = await SlowQuery.findOrCreate({
          where: { databaseId: databaseId, queryHash: QueryAnalysisService.generateQueryHash(sq.query_text) },
          defaults: {
            databaseId,
            queryText: sq.query_text,
            estimatedCost: sq.estimated_cost,
            callCount: sq.call_count,
            avgDurationMs: sq.avg_duration_ms,
            lastSeen: new Date(),
          },
        });
        if (!created) {
          // Update existing record
          await slowQuery.update({
            estimatedCost: sq.estimated_cost,
            callCount: sq.call_count,
            avgDurationMs: sq.avg_duration_ms,
            lastSeen: new Date(),
          });
        }
        createdSlowQueries.push(slowQuery);
      }

      await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(createdSlowQueries));
      return createdSlowQueries;

    } catch (error) {
      logger.error(`Error fetching slow queries for database ${databaseId}: ${error.message}`);
      throw new Error(`Failed to fetch slow queries: ${error.message}`);
    } finally {
      if (targetSequelize) {
        await targetSequelize.close(); // Close the connection
      }
    }
  }

  /**
   * Generates a simple hash for a query text.
   * Used to identify unique queries without relying on exact string matching.
   * In a real system, you might use a more robust query normalizer.
   */
  static generateQueryHash(queryText) {
    return require('crypto').createHash('md5').update(queryText).digest('hex');
  }

  /**
   * Runs EXPLAIN ANALYZE on a given query for a target database.
   * @param {number} slowQueryId - The ID of the slow query record in our system
   * @returns {Object} - Parsed EXPLAIN ANALYZE output
   */
  async getQueryExplainPlan(slowQueryId) {
    const slowQuery = await SlowQuery.findByPk(slowQueryId, { include: [Database] });
    if (!slowQuery || !slowQuery.Database) {
      throw new Error('Slow query or associated database not found.');
    }

    const cacheKey = `query_plan:${slowQueryId}`;
    let cachedPlan = await redisClient.get(cacheKey);

    if (cachedPlan) {
      logger.info(`Serving query plan for slow query ${slowQueryId} from cache.`);
      return JSON.parse(cachedPlan);
    }

    const { Database: dbRecord } = slowQuery;
    const { host, port, dbName, username, password, ssl } = dbRecord;
    const targetDbConfig = { host, port, database: dbName, username, password, dialect: 'postgres', ssl };

    let targetSequelize;
    try {
      targetSequelize = await this.getTargetDbConnection(targetDbConfig);

      const explainResult = await targetSequelize.query(`EXPLAIN (ANALYZE, VERBOSE, COSTS, BUFFERS, FORMAT JSON) ${slowQuery.queryText}`, {
        type: Sequelize.QueryTypes.SELECT,
      });

      // PostgreSQL's EXPLAIN (FORMAT JSON) returns an array of objects
      const planJson = explainResult[0]['QUERY PLAN'];
      const planText = await targetSequelize.query(`EXPLAIN ANALYZE ${slowQuery.queryText}`, {
        type: Sequelize.QueryTypes.RAW,
      });

      // Save or update the query plan in our system's DB
      const [queryPlan, created] = await QueryPlan.findOrCreate({
        where: { slowQueryId },
        defaults: {
          slowQueryId,
          planJson: planJson,
          planText: planText[0].map(row => row.substring(row.indexOf(" ") + 1)).join('\n') // Clean up "QUERY PLAN" prefix
        },
      });
      if (!created) {
        await queryPlan.update({
          planJson: planJson,
          planText: planText[0].map(row => row.substring(row.indexOf(" ") + 1)).join('\n'),
          updatedAt: new Date(),
        });
      }

      const result = {
        planJson: planJson,
        planText: queryPlan.planText // Use the cleaned version
      };
      await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(result));
      return result;

    } catch (error) {
      logger.error(`Error running EXPLAIN ANALYZE for query ${slowQueryId}: ${error.message}`);
      throw new Error(`Failed to get query explain plan: ${error.message}`);
    } finally {
      if (targetSequelize) {
        await targetSequelize.close();
      }
    }
  }

  /**
   * Analyzes an EXPLAIN plan and suggests optimizations.
   * This is a simplified heuristic-based analyzer.
   * A more advanced version would use AI/ML or a rule engine.
   * @param {Object} planJson - The JSON explain plan
   * @returns {Array<string>} - List of optimization suggestions
   */
  async analyzeExplainPlan(planJson) {
    if (!planJson || !planJson.length || !planJson[0]['Plan']) {
      return ['No plan data to analyze.'];
    }

    const plan = planJson[0]['Plan'];
    const suggestions = [];

    // Heuristics for common PostgreSQL optimization issues
    const traversePlan = (node) => {
      // High cost/rows mismatch: Suggest index or rewrite
      if (node['Actual Rows'] > 0 && node['Actual Rows'] < node['Plan Rows'] / 10 && node['Actual Total Time'] > 100) {
        suggestions.push(`Node '${node['Node Type']}' has high estimated rows (${node['Plan Rows']}) but low actual rows (${node['Actual Rows']}). Consider more selective filtering or appropriate indexes.`);
      }

      // Sequential Scan on large tables
      if (node['Node Type'] === 'Seq Scan' && node['Actual Total Time'] > 50 && node['Actual Rows'] > 1000) {
        suggestions.push(`Found a Sequential Scan on table '${node['Relation Name']}'. Consider adding an index on columns used in WHERE clauses or JOIN conditions.`);
      }

      // High CPU cost for sorts
      if (node['Node Type'] === 'Sort' && node['Actual Total Time'] > 50 && node['Sort Method'] === 'external merge') {
        suggestions.push(`High cost Sort operation with external merge on table '${node['Parent Relationship']}'. Consider adding an index on the sorted columns.`);
      }

      // Hash Join with very large build side
      if (node['Node Type'] === 'Hash Join' && node['Hash Batches'] && node['Hash Batches'] > 1) {
        suggestions.push(`Hash Join is spilling to disk (multiple hash batches). Consider increasing work_mem or optimizing the join order.`);
      }

      // Nested Loop Join without index on inner side
      if (node['Node Type'] === 'Nested Loop' && node['Plans'] && node['Plans'].length === 2) {
        const innerPlan = node['Plans'][1];
        if (innerPlan['Node Type'] === 'Seq Scan' && innerPlan['Relation Name']) {
          suggestions.push(`Nested Loop Join is performing a Sequential Scan on the inner table '${innerPlan['Relation Name']}'. Ensure an index exists on the join column(s) of the inner table.`);
        }
      }

      // CTE materialization issues (can be complex, simplified check)
      if (node['Node Type'] === 'CTE Scan' && node['Actual Total Time'] > 100 && node['CTE Name']) {
        suggestions.push(`CTE '${node['CTE Name']}' is consuming significant time. Evaluate if materialization is necessary or if rewriting to a subquery or view would be more efficient.`);
      }

      // Recursively traverse child plans
      if (node.Plans) {
        node.Plans.forEach(traversePlan);
      }
    };

    traversePlan(plan);

    if (suggestions.length === 0) {
      suggestions.push('No obvious optimization opportunities detected by the automated analyzer. The query plan looks efficient.');
    }

    // Deduplicate suggestions
    return [...new Set(suggestions)];
  }

  /**
   * Saves optimization suggestions for a slow query.
   * @param {number} slowQueryId - ID of the slow query
   * @param {Array<string>} suggestions - List of suggestions
   * @param {number} userId - ID of the user who requested/generated suggestions
   */
  async saveOptimizations(slowQueryId, suggestions, userId) {
    const existingOptimizations = await Optimization.findAll({ where: { slowQueryId } });
    const newSuggestions = suggestions.filter(s => !existingOptimizations.some(o => o.suggestionText === s));

    if (newSuggestions.length > 0) {
      const recordsToCreate = newSuggestions.map(s => ({
        slowQueryId,
        suggestionText: s,
        status: 'pending', // 'pending', 'implemented', 'rejected'
        suggestedBy: userId,
      }));
      await Optimization.bulkCreate(recordsToCreate);
      logger.info(`Saved ${newSuggestions.length} new optimization suggestions for slow query ${slowQueryId}.`);
    } else {
      logger.info(`No new optimization suggestions to save for slow query ${slowQueryId}.`);
    }
    return Optimization.findAll({ where: { slowQueryId } });
  }
}

module.exports = new QueryAnalysisService();
```