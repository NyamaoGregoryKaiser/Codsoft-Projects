const bcrypt = require('bcryptjs');
const config = require('../../config');

exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('users').del();

  const hashedPassword = await bcrypt.hash(config.ADMIN_PASSWORD, config.BCRYPT_SALT_ROUNDS);

  // Inserts seed entries
  await knex('users').insert([
    {
      name: 'Admin User',
      email: config.ADMIN_EMAIL,
      password: hashedPassword,
      role: 'admin',
      createdAt: knex.fn.now(),
      updatedAt: knex.fn.now(),
    },
    {
      name: 'John Doe',
      email: 'john.doe@example.com',
      password: await bcrypt.hash('password123', config.BCRYPT_SALT_ROUNDS),
      role: 'user',
      createdAt: knex.fn.now(),
      updatedAt: knex.fn.now(),
    },
    {
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      password: await bcrypt.hash('securepassword', config.BCRYPT_SALT_ROUNDS),
      role: 'user',
      createdAt: knex.fn.now(),
      updatedAt: knex.fn.now(),
    },
  ]);
};