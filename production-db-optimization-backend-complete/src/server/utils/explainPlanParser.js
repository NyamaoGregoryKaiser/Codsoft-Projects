/**
 * Utility to parse PostgreSQL EXPLAIN (ANALYZE, VERBOSE, BUFFERS, FORMAT JSON) output
 * and extract key performance indicators and suggestions.
 */
const logger = require('./logger');

const OPTIMIZATION_RULES = [
  // Rule 1: Sequential Scan on large tables
  {
    name: 'Missing Index (Sequential Scan)',
    condition: (node) =>
      node['Node Type'] === 'Seq Scan' &&
      (node.Rows > 1000 || node['Actual Rows'] > 1000) &&
      node.Filter, // Suggest index if there's a filter
    suggestion: (node, query) => {
      const relationName = node['Relation Name'];
      const filterCondition = node.Filter.replace(/::text/g, ''); // Basic cleanup
      const regex = new RegExp(`${relationName}\\.(\\w+)\\s*(?:=|LIKE|<|>|<=|>=|ILIKE)\\s*`, 'i');
      const match = filterCondition.match(regex);
      const columnName = match ? match[1] : 'relevant_column(s)';
      return {
        type: 'INDEX_RECOMMENDATION',
        level: 'CRITICAL',
        message: `Sequential Scan detected on table '${relationName}' which is often inefficient for large tables with filters. Consider adding an index on column(s) used in the WHERE clause, e.g., 'CREATE INDEX idx_${relationName}_${columnName} ON ${relationName} (${columnName});'`,
        details: {
          nodeType: node['Node Type'],
          relation: relationName,
          filter: node.Filter,
          estimatedRows: node.Rows,
          actualRows: node['Actual Rows'],
        },
      };
    },
  },
  // Rule 2: High cost/duration for a single node
  {
    name: 'High Cost Node',
    condition: (node) =>
      (node.hasOwnProperty('Actual Total Time') && node['Actual Total Time'] > 50) || // > 50ms
      (node.hasOwnProperty('Total Cost') && node['Total Cost'] > 10000),
    suggestion: (node, query) => ({
      type: 'PERFORMANCE_ALERT',
      level: 'WARNING',
      message: `Node type '${node['Node Type']}' is performing slowly or has high estimated cost. Actual Total Time: ${node['Actual Total Time']}ms, Total Cost: ${node['Total Cost']}. Investigate its children or underlying operations.`,
      details: {
        nodeType: node['Node Type'],
        actualTime: node['Actual Total Time'],
        totalCost: node['Total Cost'],
        parentRelation: node['Parent Relationship']
      },
    }),
  },
  // Rule 3: Hash Join without suitable memory
  {
    name: 'Inefficient Hash Join (Memory)',
    condition: (node) =>
      node['Node Type'] === 'Hash Join' &&
      node['Hash Cond'] &&
      node.hasOwnProperty('Hash Batches') &&
      node['Hash Batches'] > 1, // Indicates spill to disk
    suggestion: (node, query) => ({
      type: 'CONFIGURATION_ADJUSTMENT',
      level: 'CRITICAL',
      message: `Hash Join spilled to disk (${node['Hash Batches']} batches). This indicates insufficient 'work_mem'. Consider increasing 'work_mem' for this session or globally if this is a common issue.`,
      details: {
        nodeType: node['Node Type'],
        hashCondition: node['Hash Cond'],
        hashBatches: node['Hash Batches'],
      },
    }),
  },
  // Rule 4: High "Rows Removed by Filter" - might indicate non-selective index or poor WHERE clause
  {
    name: 'Ineffective Filtering',
    condition: (node) =>
      node.hasOwnProperty('Rows Removed by Filter') && node['Rows Removed by Filter'] > node['Actual Rows'] * 2 && node['Actual Rows'] > 0,
    suggestion: (node, query) => ({
      type: 'QUERY_REFACTOR',
      level: 'WARNING',
      message: `Many rows (${node['Rows Removed by Filter']}) were filtered out after being scanned. This might indicate a non-selective index, an inefficient WHERE clause, or unnecessary data retrieval. Review the filter condition: '${node.Filter}'.`,
      details: {
        nodeType: node['Node Type'],
        filter: node.Filter,
        rowsRemoved: node['Rows Removed by Filter'],
        actualRows: node['Actual Rows'],
      },
    }),
  },
  // Rule 5: Index Scan but too many rows (maybe index is not selective enough for the query)
  {
    name: 'Index Scan - Low Selectivity',
    condition: (node) =>
      (node['Node Type'] === 'Index Scan' || node['Node Type'] === 'Index Only Scan') &&
      (node.hasOwnProperty('Rows') && node.Rows > 1000 && node.Rows / node.['Plan Rows'] > 0.5) && // High estimated rows
      (node.hasOwnProperty('Actual Rows') && node['Actual Rows'] > 1000 && node['Actual Rows'] / node['Plan Rows'] > 0.5), // High actual rows compared to plan
    suggestion: (node, query) => {
      const indexName = node['Index Name'];
      const relationName = node['Relation Name'];
      return {
        type: 'INDEX_REVIEW',
        level: 'INFO',
        message: `An Index Scan on '${indexName}' for table '${relationName}' returned a large number of rows (${node['Actual Rows']}). While an index was used, consider if the index is selective enough for this specific query, or if a different access path might be more efficient for such broad results.`,
        details: {
          nodeType: node['Node Type'],
          indexName: indexName,
          relation: relationName,
          actualRows: node['Actual Rows'],
        },
      };
    },
  },
];


function traversePlan(plan, query, suggestions = []) {
  if (!plan) return suggestions;

  OPTIMIZATION_RULES.forEach(rule => {
    if (rule.condition(plan)) {
      suggestions.push(rule.suggestion(plan, query));
    }
  });

  if (plan.Plans) {
    for (const childPlan of plan.Plans) {
      traversePlan(childPlan, query, suggestions);
    }
  }

  return suggestions;
}

function parseExplainOutput(explainJson, query) {
  if (!explainJson || !Array.isArray(explainJson) || explainJson.length === 0) {
    throw new Error('Invalid EXPLAIN JSON output.');
  }

  const plan = explainJson[0].Plan;
  if (!plan) {
    throw new Error('EXPLAIN output does not contain a plan.');
  }

  const totalTime = explainJson[0]['Execution Time'];
  const planningTime = explainJson[0]['Planning Time'];

  const suggestions = traversePlan(plan, query);

  return {
    query,
    totalTime,
    planningTime,
    planJson: plan,
    suggestions,
  };
}

module.exports = { parseExplainOutput, OPTIMIZATION_RULES };