const sequelize = require('../../src/db/models'); // This imports the configured sequelize instance

const setupTestDB = () => {
  beforeAll(async () => {
    // Ensure the database connection uses the 'test' environment config
    // The `sequelize` instance is already configured for `process.env.NODE_ENV`
    // which should be 'test' in the CI/jest config.
    await sequelize.sequelize.authenticate();
    await sequelize.sequelize.sync({ force: true }); // Drop tables and re-create
  });

  beforeEach(async () => {
    // Clear all tables before each test
    await Promise.all(
      Object.values(sequelize.sequelize.models).map((model) =>
        model.destroy({ truncate: true, restartIdentity: true, cascade: true })
      )
    );
  });

  afterAll(async () => {
    await sequelize.sequelize.close(); // Close the database connection
  });
};

module.exports = setupTestDB;