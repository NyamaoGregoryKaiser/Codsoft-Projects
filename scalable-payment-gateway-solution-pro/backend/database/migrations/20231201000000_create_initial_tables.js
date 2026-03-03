/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    .createTable('users', (table) => {
      table.increments('id').primary();
      table.string('firstName').notNullable();
      table.string('lastName').notNullable();
      table.string('email').unique().notNullable();
      table.string('password').notNullable();
      table.enum('role', ['user', 'admin']).notNullable().defaultTo('user');
      table.timestamps(true, true);
    })
    .createTable('accounts', (table) => {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.string('account_number').unique().notNullable();
      table.decimal('balance', 18, 2).notNullable().defaultTo(0.00);
      table.string('currency', 3).notNullable(); // e.g., 'USD', 'EUR'
      table.timestamps(true, true);

      table.unique(['user_id', 'currency']); // A user can only have one account per currency
    })
    .createTable('transactions', (table) => {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE'); // The user who initiated/owns the transaction
      table.integer('from_account_id').unsigned().references('id').inTable('accounts').onDelete('SET NULL');
      table.integer('to_account_id').unsigned().references('id').inTable('accounts').onDelete('SET NULL');
      table.decimal('amount', 18, 2).notNullable();
      table.string('currency', 3).notNullable();
      table.enum('type', ['deposit', 'withdrawal', 'transfer', 'payment_in', 'payment_out', 'refund']).notNullable();
      table.enum('status', ['pending', 'completed', 'failed', 'reversed']).notNullable().defaultTo('pending');
      table.text('description');
      table.string('reference_id'); // e.g., for linking to a payment gateway transaction
      table.timestamps(true, true);

      // Indexes for faster lookups
      table.index(['user_id']);
      table.index(['from_account_id']);
      table.index(['to_account_id']);
    })
    .createTable('payments', (table) => {
        table.increments('id').primary();
        table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.integer('account_id').unsigned().notNullable().references('id').inTable('accounts').onDelete('CASCADE');
        table.decimal('amount', 18, 2).notNullable();
        table.string('currency', 3).notNullable();
        table.string('gateway_transaction_id').unique(); // ID from external payment gateway
        table.enum('status', ['pending', 'completed', 'failed', 'refunded']).notNullable().defaultTo('pending');
        table.jsonb('gateway_response'); // Store full gateway response if needed
        table.enum('type', ['charge', 'refund', 'payout']).notNullable().defaultTo('charge');
        table.timestamps(true, true);

        table.index(['user_id']);
        table.index(['account_id']);
        table.index(['gateway_transaction_id']);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('payments')
    .dropTableIfExists('transactions')
    .dropTableIfExists('accounts')
    .dropTableIfExists('users');
};