const bcrypt = require('bcryptjs');

exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('users').del();

  const hashedPassword = await bcrypt.hash('adminpassword', 10);

  // Inserts seed entries
  await knex('users').insert([
    {
      username: 'admin',
      email: 'admin@dbtune.com',
      password_hash: hashedPassword,
      role: 'admin',
    },
  ]);
};