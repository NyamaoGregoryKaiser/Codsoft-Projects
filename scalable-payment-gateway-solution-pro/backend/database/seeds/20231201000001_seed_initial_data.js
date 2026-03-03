/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
const bcrypt = require('bcryptjs');

exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('payments').del();
  await knex('transactions').del();
  await knex('accounts').del();
  await knex('users').del();

  const hashedPassword = await bcrypt.hash('Password123!', 10);

  // Inserts seed entries
  const [user1Id, user2Id] = await knex('users').insert([
    {
      firstName: 'Alice',
      lastName: 'Smith',
      email: 'alice@example.com',
      password: hashedPassword,
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      firstName: 'Bob',
      lastName: 'Johnson',
      email: 'bob@example.com',
      password: hashedPassword,
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]).returning('id');

  const [aliceUSDAccountId, aliceEURAccountId, bobUSDAccountId] = await knex('accounts').insert([
    {
      user_id: user1Id.id,
      account_number: 'ACC-ALICE-USD-001',
      balance: 1000.00,
      currency: 'USD',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      user_id: user1Id.id,
      account_number: 'ACC-ALICE-EUR-002',
      balance: 500.00,
      currency: 'EUR',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      user_id: user2Id.id,
      account_number: 'ACC-BOB-USD-001',
      balance: 750.00,
      currency: 'USD',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]).returning('id');

  await knex('transactions').insert([
    {
      user_id: user1Id.id,
      from_account_id: null, // Deposit
      to_account_id: aliceUSDAccountId.id,
      amount: 1000.00,
      currency: 'USD',
      type: 'deposit',
      status: 'completed',
      description: 'Initial deposit',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      user_id: user1Id.id,
      from_account_id: aliceUSDAccountId.id,
      to_account_id: bobUSDAccountId.id,
      amount: 100.00,
      currency: 'USD',
      type: 'transfer',
      status: 'completed',
      description: 'Transfer to Bob',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      user_id: user2Id.id,
      from_account_id: null,
      to_account_id: bobUSDAccountId.id,
      amount: 750.00,
      currency: 'USD',
      type: 'deposit',
      status: 'completed',
      description: 'Initial deposit',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  ]);
};