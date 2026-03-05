const { parseExplainOutput, OPTIMIZATION_RULES } = require('../../utils/explainPlanParser');

describe('Explain Plan Parser Unit Tests', () => {
  test('should parse a basic EXPLAIN JSON and extract total time', () => {
    const explainJson = [
      {
        "Plan": {
          "Node Type": "Seq Scan",
          "Actual Total Time": 10.5,
          "Planning Time": 1.2
        },
        "Execution Time": 10.5
      }
    ];
    const query = 'SELECT * FROM users;';
    const result = parseExplainOutput(explainJson, query);
    expect(result).toBeDefined();
    expect(result.totalTime).toBe(10.5);
    expect(result.planningTime).toBe(1.2);
    expect(result.query).toBe(query);
  });

  test('should identify sequential scan with filter as missing index', () => {
    const explainJson = [
      {
        "Plan": {
          "Node Type": "Seq Scan",
          "Relation Name": "products",
          "Schema": "public",
          "Actual Rows": 1500,
          "Actual Total Time": 120.5,
          "Filter": "(price < 100::numeric)",
          "Rows Removed by Filter": 500
        },
        "Execution Time": 120.5
      }
    ];
    const query = 'SELECT * FROM products WHERE price < 100;';
    const result = parseExplainOutput(explainJson, query);
    expect(result.suggestions).toBeDefined();
    expect(result.suggestions.length).toBeGreaterThan(0);
    const suggestion = result.suggestions.find(s => s.type === 'INDEX_RECOMMENDATION');
    expect(suggestion).toBeDefined();
    expect(suggestion.level).toBe('CRITICAL');
    expect(suggestion.message).toContain('Sequential Scan detected on table \'products\'');
    expect(suggestion.message).toContain('index on column(s) used in the WHERE clause, e.g., \'CREATE INDEX idx_products_price ON products (price);\'');
  });

  test('should identify high cost node', () => {
    const explainJson = [
      {
        "Plan": {
          "Node Type": "Aggregate",
          "Strategy": "Plain",
          "Actual Total Time": 150.7,
          "Total Cost": 15000.0,
          "Plans": [
            {
              "Node Type": "Hash Join",
              "Actual Total Time": 140.0,
              "Total Cost": 14000.0,
              "Hash Cond": "(t1.id = t2.t1_id)"
            }
          ]
        },
        "Execution Time": 150.7
      }
    ];
    const query = 'SELECT count(*) FROM t1 JOIN t2 ON t1.id = t2.t1_id;';
    const result = parseExplainOutput(explainJson, query);
    expect(result.suggestions).toBeDefined();
    expect(result.suggestions.some(s => s.type === 'PERFORMANCE_ALERT')).toBe(true);
    const suggestion = result.suggestions.find(s => s.type === 'PERFORMANCE_ALERT' && s.details.nodeType === 'Aggregate');
    expect(suggestion).toBeDefined();
    expect(suggestion.level).toBe('WARNING');
    expect(suggestion.message).toContain("Node type 'Aggregate' is performing slowly or has high estimated cost.");
  });

  test('should identify inefficient hash join (spill to disk)', () => {
    const explainJson = [
      {
        "Plan": {
          "Node Type": "Hash Join",
          "Actual Total Time": 200.0,
          "Total Cost": 25000.0,
          "Hash Cond": "(users.id = orders.user_id)",
          "Hash Batches": 5, // Indicates spill
          "Plans": [
            { "Node Type": "Seq Scan", "Relation Name": "users" },
            { "Node Type": "Hash", "Plans": [{ "Node Type": "Seq Scan", "Relation Name": "orders" }] }
          ]
        },
        "Execution Time": 200.0
      }
    ];
    const query = 'SELECT * FROM users JOIN orders ON users.id = orders.user_id;';
    const result = parseExplainOutput(explainJson, query);
    expect(result.suggestions).toBeDefined();
    expect(result.suggestions.some(s => s.type === 'CONFIGURATION_ADJUSTMENT')).toBe(true);
    const suggestion = result.suggestions.find(s => s.type === 'CONFIGURATION_ADJUSTMENT');
    expect(suggestion).toBeDefined();
    expect(suggestion.level).toBe('CRITICAL');
    expect(suggestion.message).toContain('Hash Join spilled to disk');
    expect(suggestion.message).toContain('insufficient \'work_mem\'');
  });

  test('should identify ineffective filtering', () => {
    const explainJson = [
      {
        "Plan": {
          "Node Type": "Index Scan",
          "Relation Name": "large_table",
          "Index Name": "idx_large_table_status",
          "Actual Rows": 50,
          "Rows Removed by Filter": 5000,
          "Filter": "(status = 'inactive')",
          "Actual Total Time": 80.0
        },
        "Execution Time": 80.0
      }
    ];
    const query = "SELECT * FROM large_table WHERE status = 'inactive';";
    const result = parseExplainOutput(explainJson, query);
    expect(result.suggestions).toBeDefined();
    expect(result.suggestions.some(s => s.type === 'QUERY_REFACTOR')).toBe(true);
    const suggestion = result.suggestions.find(s => s.type === 'QUERY_REFACTOR');
    expect(suggestion).toBeDefined();
    expect(suggestion.level).toBe('WARNING');
    expect(suggestion.message).toContain('Many rows (5000) were filtered out after being scanned.');
  });


  test('should throw error for invalid EXPLAIN JSON', () => {
    const invalidJson = [];
    const query = 'SELECT 1;';
    expect(() => parseExplainOutput(invalidJson, query)).toThrow('Invalid EXPLAIN JSON output.');
    const emptyPlanJson = [{ "No Plan": {} }];
    expect(() => parseExplainOutput(emptyPlanJson, query)).toThrow('EXPLAIN output does not contain a plan.');
  });

});