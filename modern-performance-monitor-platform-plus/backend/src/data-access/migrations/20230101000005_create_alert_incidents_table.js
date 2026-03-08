```javascript
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('alert_incidents', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('alert_id').notNullable();
    table.uuid('project_id').notNullable();
    table.string('status').notNullable().defaultTo('triggered'); // 'triggered', 'resolved', 'acknowledged'
    table.jsonb('triggered_value').notNullable(); // Value that caused the alert
    table.timestamp('triggered_at').notNullable();
    table.timestamp('resolved_at');
    table.timestamps(true, true);

    table.foreign('alert_id').references('id').inTable('alerts').onDelete('CASCADE');
    table.foreign('project_id').references('id').inTable('projects').onDelete('CASCADE');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('alert_incidents');
};
```