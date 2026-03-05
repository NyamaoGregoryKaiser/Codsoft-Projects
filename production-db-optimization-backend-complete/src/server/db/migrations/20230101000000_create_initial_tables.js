exports.up = function(knex) {
  return knex.schema
    .createTable('users', (table) => {
      table.increments('id').primary();
      table.string('username', 255).notNullable();
      table.string('email', 255).notNullable().unique();
      table.string('password_hash', 255).notNullable();
      table.enum('role', ['user', 'admin']).notNullable().defaultTo('user');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    })
    .createTable('connections', (table) => {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable();
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.string('name', 255).notNullable();
      table.string('host', 255).notNullable();
      table.integer('port').notNullable();
      table.string('user', 255).notNullable();
      table.string('password', 255).notNullable(); // Stored encrypted
      table.string('database', 255).notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      table.unique(['user_id', 'name']); // User can't have two connections with same name
    })
    .createTable('query_analyses', (table) => {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable();
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.integer('connection_id').unsigned().notNullable();
      table.foreign('connection_id').references('id').inTable('connections').onDelete('CASCADE');
      table.text('query_text').notNullable();
      table.jsonb('plan_json').notNullable(); // Store EXPLAIN JSON output
      table.float('total_time_ms');
      table.float('planning_time_ms');
      table.timestamp('created_at').defaultTo(knex.fn.now());
    })
    .createTable('optimization_suggestions', (table) => {
      table.increments('id').primary();
      table.integer('analysis_id').unsigned().notNullable();
      table.foreign('analysis_id').references('id').inTable('query_analyses').onDelete('CASCADE');
      table.string('type', 255).notNullable(); // e.g., 'INDEX_RECOMMENDATION', 'CONFIGURATION_ADJUSTMENT'
      table.string('level', 255).notNullable(); // e.g., 'CRITICAL', 'WARNING', 'INFO'
      table.text('message').notNullable();
      table.jsonb('details'); // Additional details about the suggestion
      table.enum('status', ['pending', 'applied', 'dismissed']).notNullable().defaultTo('pending');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    })
    .createTable('metrics_history', (table) => {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable();
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.integer('connection_id').unsigned().notNullable();
      table.foreign('connection_id').references('id').inTable('connections').onDelete('CASCADE');
      table.integer('active_connections').notNullable();
      table.integer('total_connections').notNullable();
      table.bigint('database_size_bytes').notNullable(); // Use bigint for size
      table.float('cache_hit_ratio_percent');
      table.integer('slow_queries_count'); // Placeholder for number of slow queries
      table.timestamp('created_at').defaultTo(knex.fn.now());
      // Add more metric fields as needed
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('metrics_history')
    .dropTableIfExists('optimization_suggestions')
    .dropTableIfExists('query_analyses')
    .dropTableIfExists('connections')
    .dropTableIfExists('users');
};