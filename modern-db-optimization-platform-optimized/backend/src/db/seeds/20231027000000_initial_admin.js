const bcrypt = require('bcryptjs');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('users').del()

  const hashedPassword = await bcrypt.hash('adminpassword', 10);

  // Inserts seed entries
  await knex('users').insert([
    {
      username: 'admin',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin'
    }
  ]);
};