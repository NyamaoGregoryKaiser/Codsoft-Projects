exports.up = function(knex) {
  return knex.schema.createTable('orders', function(table) {
    table.increments('id').primary();
    table.integer('userId').unsigned().notNullable();
    table.decimal('totalAmount', 10, 2).notNullable();
    table.string('shippingAddress', 512).notNullable();
    table.string('paymentMethod', 255).notNullable();
    table.enum('status', ['pending', 'processing', 'shipped', 'delivered', 'cancelled']).notNullable().defaultTo('pending');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    table.foreign('userId')
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
  })
  .createTable('order_items', function(table) {
    table.increments('id').primary();
    table.integer('orderId').unsigned().notNullable();
    table.integer('productId').unsigned().notNullable();
    table.integer('quantity').notNullable();
    table.decimal('price', 10, 2).notNullable(); // Price at the time of order
    table.timestamp('createdAt').defaultTo(knex.fn.now());

    table.foreign('orderId')
      .references('id')
      .inTable('orders')
      .onDelete('CASCADE');

    table.foreign('productId')
      .references('id')
      .inTable('products')
      .onDelete('CASCADE');
  })
  .then(() => knex.schema.alterTable('orders', (table) => {
    table.index('userId');
    table.index('status');
  }));
};

exports.down = function(knex) {
  return knex.schema.dropTable('order_items')
    .then(() => knex.schema.dropTable('orders'));
};