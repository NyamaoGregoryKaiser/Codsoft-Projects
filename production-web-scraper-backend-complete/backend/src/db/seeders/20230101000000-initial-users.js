const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    const adminUserId = uuidv4();
    const userUserId = uuidv4();

    await queryInterface.bulkInsert('users', [
      {
        id: adminUserId,
        name: 'Admin User',
        email: 'admin@example.com',
        password: await bcrypt.hash('adminpassword', 10),
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: userUserId,
        name: 'Regular User',
        email: 'user@example.com',
        password: await bcrypt.hash('userpassword', 10),
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ], {});

    // You can also seed initial targets for these users
    await queryInterface.bulkInsert('targets', [
      {
        id: uuidv4(),
        userId: adminUserId,
        name: 'Example Admin Target',
        url: 'https://www.google.com',
        selectors: {
          title: 'title',
          description: 'meta[name="description"]::attr(content)', // Example for attribute extraction (would need custom Puppeteer logic to handle this)
        },
        schedule: '0 */6 * * *', // Every 6 hours
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        userId: userUserId,
        name: 'Example User Target',
        url: 'https://www.wikipedia.org/',
        selectors: {
          mainTitle: '#mw-indicator-lang-text',
          paragraph: '#mp-topbanner > div > div:nth-child(2) > p',
        },
        schedule: null, // Manual scrape
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', null, {});
    await queryInterface.bulkDelete('targets', null, {});
  },
};