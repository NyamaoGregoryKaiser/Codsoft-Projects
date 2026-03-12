```javascript
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    .createTable('users', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('email').unique().notNullable();
      table.string('password').notNullable();
      table.string('first_name');
      table.string('last_name');
      table.enum('role', ['admin', 'merchant', 'customer']).notNullable().defaultTo('customer'); // RBAC
      table.boolean('is_active').defaultTo(true);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      table.index(['email', 'role']);
    })
    .createTable('merchants', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.string('name').notNullable();
      table.string('legal_name');
      table.string('website_url');
      table.string('business_address');
      table.string('phone_number');
      table.enum('status', ['pending', 'approved', 'rejected']).notNullable().defaultTo('pending');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      table.unique('user_id');
      table.index('status');
    })
    .createTable('products', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('merchant_id').notNullable().references('id').inTable('merchants').onDelete('CASCADE');
      table.string('name').notNullable();
      table.text('description');
      table.decimal('price', 10, 2).notNullable(); // Max 99,999,999.99
      table.string('currency', 3).notNullable().defaultTo('USD');
      table.integer('stock_quantity').notNullable().defaultTo(0);
      table.string('image_url');
      table.boolean('is_active').defaultTo(true);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      table.index(['merchant_id', 'is_active']);
    })
    .createTable('payment_intents', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').nullable().references('id').inTable('users').onDelete('SET NULL'); // Customer initiating
      table.uuid('product_id').notNullable().references('id').inTable('products').onDelete('RESTRICT'); // Product being paid for
      table.uuid('merchant_id').notNullable().references('id').inTable('merchants').onDelete('RESTRICT'); // Merchant receiving payment
      table.string('external_id').unique(); // ID from mock payment gateway
      table.decimal('amount', 10, 2).notNullable();
      table.string('currency', 3).notNullable();
      table.enum('status', ['created', 'pending', 'succeeded', 'failed', 'canceled']).notNullable().defaultTo('created');
      table.jsonb('metadata'); // Any additional data to store (e.g., customer details, product options)
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      table.index(['user_id', 'status']);
      table.index('external_id');
    })
    .createTable('transactions', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('payment_intent_id').unique().notNullable().references('id').inTable('payment_intents').onDelete('CASCADE');
      table.uuid('user_id').nullable().references('id').inTable('users').onDelete('SET NULL'); // Customer who made the purchase
      table.uuid('merchant_id').notNullable().references('id').inTable('merchants').onDelete('RESTRICT'); // Merchant receiving
      table.uuid('product_id').notNullable().references('id').inTable('products').onDelete('RESTRICT'); // Product purchased
      table.decimal('amount', 10, 2).notNullable();
      table.string('currency', 3).notNullable();
      table.enum('type', ['sale', 'refund', 'chargeback']).notNullable().defaultTo('sale');
      table.enum('status', ['completed', 'failed', 'refunded', 'disputed']).notNullable().defaultTo('completed');
      table.string('external_transaction_id'); // If gateway provides a specific transaction ID
      table.jsonb('details'); // Additional transaction details (e.g., fees, customer notes)
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      table.index(['merchant_id', 'created_at']);
      table.index(['user_id', 'created_at']);
      table.index(['status', 'type']);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('transactions')
    .dropTableIfExists('payment_intents')
    .dropTableIfExists('products')
    .dropTableIfExists('merchants')
    .dropTableIfExists('users');
};
```

#### Seed Data