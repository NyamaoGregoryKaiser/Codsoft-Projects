/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('recommendations', (table) => {
        table.increments('id').primary();
        table.integer('db_connection_id').unsigned().notNullable();
        table.string('type').notNullable(); // e.g., 'index_missing', 'index_unused', 'slow_query'
        table.string('title').notNullable();
        table.text('description').notNullable();
        table.text('sql_suggestion'); // Optional SQL to implement the recommendation
        table.string('severity').notNullable(); // 'critical', 'high', 'medium', 'low'
        table.string('status').notNullable().defaultTo('pending'); // 'pending', 'implemented', 'dismissed'
        table.jsonb('details'); // Additional JSON data for the recommendation
        table.timestamp('generated_at').defaultTo(knex.fn.now());
        table.timestamp('resolved_at');

        table.foreign('db_connection_id').references('id').inTable('db_connections').onDelete('CASCADE');
        table.index(['db_connection_id', 'generated_at']);
        table.index(['db_connection_id', 'status']);
        table.index(['db_connection_id', 'type']);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.dropTableIfExists('recommendations');
};