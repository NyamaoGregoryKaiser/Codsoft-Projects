```javascript
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('metric_data', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('project_id').notNullable();
    table.string('metric_type').notNullable(); // e.g., 'http_request', 'resource_usage', 'error', 'custom_event'
    table.timestamp('timestamp').notNullable().index(); // Indexed for time-series queries
    table.jsonb('data').notNullable(); // Flexible JSONB column for metric payload
    table.timestamps(true, true);

    table.foreign('project_id').references('id').inTable('projects').onDelete('CASCADE');

    // Add specific indexes for common query patterns
    table.index(['project_id', 'metric_type', 'timestamp']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('metric_data');
};
```