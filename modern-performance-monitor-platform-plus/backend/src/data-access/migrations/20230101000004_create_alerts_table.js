```javascript
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('alerts', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('project_id').notNullable();
    table.string('name').notNullable();
    table.string('metric_type').notNullable(); // e.g., 'http_request'
    table.string('aggregation_type').notNullable(); // e.g., 'avg', 'sum', 'count'
    table.string('field').notNullable(); // e.g., 'data->>durationMs' for HTTP request duration
    table.string('operator').notNullable(); // e.g., '>', '<', '='
    table.float('threshold').notNullable();
    table.integer('time_window_minutes').notNullable(); // e.g., 5 minutes
    table.boolean('is_enabled').defaultTo(true);
    table.timestamps(true, true);

    table.foreign('project_id').references('id').inTable('projects').onDelete('CASCADE');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('alerts');
};
```