module.exports = {
  env: {
    browser: true,
    es2021: true,
    jest: true
  },
  extends: [
    'react-app',
    'react-app/jest'
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    },
    ecmaVersion: 12,
    sourceType: 'module'
  },
  plugins: [
    'react',
    'react-hooks'
  ],
  rules: {
    // Custom rules or overrides
    'react/jsx-filename-extension': [1, { extensions: ['.js', '.jsx'] }],
    'react/react-in-jsx-scope': 'off', // Not needed for React 17+ with new JSX transform
    'react/jsx-props-no-spreading': 'off', // Allow prop spreading for flexibility
    'arrow-body-style': 'off',
    'prefer-arrow-callback': 'off',
    'indent': ['error', 2],
    'linebreak-style': ['error', 'unix'],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    'comma-dangle': ['error', 'never'],
    'no-unused-vars': ['warn', { args: 'none' }], // Warn for unused vars, ignore args
    'max-len': ['warn', { 'code': 120, 'ignoreUrls': true }], // Max line length
    'react-hooks/rules-of-hooks': 'error', // Checks rules of Hooks
    'react-hooks/exhaustive-deps': 'warn' // Checks effect dependencies
  }
};
```

```