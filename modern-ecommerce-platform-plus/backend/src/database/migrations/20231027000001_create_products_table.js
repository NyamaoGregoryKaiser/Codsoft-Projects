exports.up = function(knex) {
  return knex.schema.createTable('products', function(table) {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
    table.text('description');
    table.decimal('price', 10, 2).notNullable();
    table.integer('stock').notNullable().defaultTo(0);
    table.integer('categoryId').unsigned().nullable(); // Foreign key to categories table
    table.string('imageUrl', 1024);
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    table.foreign('categoryId')
      .references('id')
      .inTable('categories')
      .onDelete('SET NULL'); // If category is deleted, set categoryId to NULL
  })
  .then(() => knex.schema.alterTable('products', (table) => {
    // Add index for faster lookups by category and name
    table.index(['categoryId', 'name']);
    table.index('price');
  }));
};

exports.down = function(knex) {
  return knex.schema.dropTable('products');
};