const { v4: uuidv4 } = require('uuid');
const { Target } = require('../../src/db/models');
const { userOne, adminUser } = require('./user.fixture');

const targetOne = {
  id: uuidv4(),
  userId: userOne.id,
  name: 'User One Target',
  url: 'https://www.google.com/search?q=test1',
  selectors: {
    title: 'title',
    searchBar: 'input[name="q"]'
  },
  schedule: '0 0 * * *',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const targetTwo = {
  id: uuidv4(),
  userId: adminUser.id,
  name: 'Admin Target',
  url: 'https://www.bing.com/search?q=test2',
  selectors: {
    mainHeading: 'h1',
    description: '.b_content'
  },
  schedule: null, // Manual
  createdAt: new Date(),
  updatedAt: new Date(),
};

const insertTargets = async (targets) => {
  await Target.bulkCreate(targets);
};

module.exports = {
  targetOne,
  targetTwo,
  insertTargets,
};