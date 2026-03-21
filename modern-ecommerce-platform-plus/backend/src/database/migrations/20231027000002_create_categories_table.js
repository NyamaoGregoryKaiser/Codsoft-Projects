exports.up = function(knex) {
  return knex.schema.createTable('categories', function(table) {
    table.increments('id').primary();
    table.string('name', 255).notNullable().unique();
    table.text('description');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('categories');
};