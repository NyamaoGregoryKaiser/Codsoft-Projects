exports.up = function(knex) {
  return knex.schema.createTable('cart_items', function(table) {
    table.increments('id').primary();
    table.integer('userId').unsigned().notNullable();
    table.integer('productId').unsigned().notNullable();
    table.integer('quantity').notNullable().defaultTo(1);
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    table.foreign('userId')
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');

    table.foreign('productId')
      .references('id')
      .inTable('products')
      .onDelete('CASCADE');

    table.unique(['userId', 'productId']); // A user can only have one entry per product in their cart
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('cart_items');
};