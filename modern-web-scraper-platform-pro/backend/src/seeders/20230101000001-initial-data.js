```javascript
// backend/src/seeders/20230101000001-initial-data.js
'use strict';
const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const hashedPassword = await bcrypt.hash('password123', 10);

    await queryInterface.bulkInsert('Users', [{
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    }, {
      email: 'user@example.com',
      password: hashedPassword,
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date()
    }], {});

    const users = await queryInterface.sequelize.query(
      `SELECT id from "Users";`
    );
    const adminUserId = users[0][0].id;
    const regularUserId = users[0][1].id;

    await queryInterface.bulkInsert('Websites', [{
      name: 'Example News Blog',
      url: 'https://blog.scrapinghub.com/', // A real blog to potentially scrape
      description: 'A blog about web scraping and data extraction.',
      createdAt: new Date(),
      updatedAt: new Date()
    }, {
      name: 'Another Example Site',
      url: 'https://quotes.toscrape.com/', // A classic example site
      description: 'A website for quotes (good for static scraping demo).',
      createdAt: new Date(),
      updatedAt: new Date()
    }], {});

    const websites = await queryInterface.sequelize.query(
      `SELECT id from "Websites";`
    );
    const newsBlogId = websites[0][0].id;
    const quotesSiteId = websites[0][1].id;

    await queryInterface.bulkInsert('ScrapingJobs', [{
      name: 'Scrape News Blog Titles',
      websiteId: newsBlogId,
      cronSchedule: '0 0 * * *', // Every day at midnight
      status: 'pending',
      selectorConfig: JSON.stringify({
        items: ".post-item",
        fields: {
          title: "h2.entry-title a",
          url: "h2.entry-title a[href]",
          author: ".entry-author a"
        }
      }),
      userId: adminUserId,
      createdAt: new Date(),
      updatedAt: new Date()
    }, {
      name: 'Scrape Famous Quotes',
      websiteId: quotesSiteId,
      cronSchedule: null, // Manual run
      status: 'pending',
      selectorConfig: JSON.stringify({
        items: ".quote",
        fields: {
          text: ".text",
          author: ".author",
          tags: ".tag"
        }
      }),
      userId: regularUserId,
      createdAt: new Date(),
      updatedAt: new Date()
    }], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('JobLogs', null, {});
    await queryInterface.bulkDelete('ScrapedData', null, {});
    await queryInterface.bulkDelete('ScrapingJobs', null, {});
    await queryInterface.bulkDelete('Websites', null, {});
    await queryInterface.bulkDelete('Users', null, {});
  }
};
```