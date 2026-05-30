```javascript
module.exports = {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "tests",
    "config",
    "migrations",
    "seeders",
    "coverage",
    "server.js", // Entry point file
    "app.js", // Main app setup file (integration tests cover routes)
    "src/models/index.js" // Sequelize init file
  ],
  collectCoverage: true,
  coverageReporters: ["json", "lcov", "text", "clover"],
  verbose: true,
  forceExit: true, // Ensure Jest exits after tests complete, useful with database connections
  detectOpenHandles: true, // Helps identify lingering async operations
  setupFilesAfterEnv: ['./tests/setup.js'], // Global setup for tests
};
```