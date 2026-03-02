module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
    node: true,
    jest: true
  },
  extends: [
    'airbnb-base'
  ],
  parserOptions: {
    ecmaVersion: 12
  },
  rules: {
    'no-console': 'off', // Allow console.log for server-side
    'indent': ['error', 2], // Enforce 2 spaces for indentation
    'linebreak-style': ['error', 'unix'], // Enforce Unix line endings
    'quotes': ['error', 'single'], // Enforce single quotes
    'semi': ['error', 'always'], // Enforce semicolons
    'comma-dangle': ['error', 'never'], // Disallow trailing commas
    'object-curly-newline': ['error', { consistent: true }], // Consistent newline for object properties
    'arrow-body-style': 'off', // Allow concise or block body for arrow functions
    'consistent-return': 'off', // Allow functions to sometimes return a value, sometimes not
    'no-underscore-dangle': 'off', // Allow dangling underscores for private variables
    'class-methods-use-this': 'off', // Allow class methods that don't use 'this'
    'max-len': ['error', { 'code': 120, 'ignoreUrls': true }], // Max line length
    'import/no-extraneous-dependencies': ['error', { devDependencies: ['**/*.test.js', '**/tests/*.js'] }]
  }
};
```

```