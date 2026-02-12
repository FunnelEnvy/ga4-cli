import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        AbortController: 'readonly',
        Response: 'readonly',
        RequestInit: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    ignores: ['dist/', 'node_modules/', '*.config.ts', '*.config.js'],
  },
];
