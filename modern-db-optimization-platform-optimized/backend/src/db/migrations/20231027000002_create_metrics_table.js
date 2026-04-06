/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('metrics', (table) => {
        table.increments('id').primary();
        table.integer('db_connection_id').unsigned().notNullable();
        table.timestamp('timestamp').defaultTo(knex.fn.now());
        table.jsonb('data').notNullable(); // Store JSON data for various metrics

        table.foreign('db_connection_id').references('id').inTable('db_connections').onDelete('CASCADE');
        table.index(['db_connection_id', 'timestamp']);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.dropTableIfExists('metrics');
};