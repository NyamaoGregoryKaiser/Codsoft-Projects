/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('db_connections', (table) => {
        table.increments('id').primary();
        table.integer('user_id').unsigned().notNullable();
        table.string('name').notNullable();
        table.string('type').notNullable().defaultTo('postgresql'); // e.g., 'postgresql', 'mysql'
        table.string('host').notNullable();
        table.integer('port').notNullable().defaultTo(5432);
        table.string('username').notNullable();
        table.string('password').notNullable(); // Stored encrypted
        table.string('database').notNullable();
        table.boolean('is_monitoring_active').defaultTo(false);
        table.timestamps(true, true);

        table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
        table.unique(['user_id', 'name']); // Each user must have unique database connection names
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.dropTableIfExists('db_connections');
};