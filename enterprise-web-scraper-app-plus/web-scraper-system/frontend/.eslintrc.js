```javascript
module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: [
    'react',
    'react-hooks',
  ],
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    'react/prop-types': 'off', // Disable prop-types validation if using TypeScript or confident in prop types
    'react/react-in-jsx-scope': 'off', // Not needed for React 17+ with new JSX transform
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    'indent': ['error', 2],
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': ['error', 'never'],
    'no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }], // Warn for unused vars, ignore if prefixed with _
    'comma-dangle': ['error', 'always-multiline'], // Enforce trailing commas for multiline arrays/objects
  },
};
```