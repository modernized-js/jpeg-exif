import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import unicorn from 'eslint-plugin-unicorn';
import promise from 'eslint-plugin-promise';
import prettier from 'eslint-config-prettier/flat';
import globals from 'globals';

export default [
  {
    ignores: ['dist/**', 'dist-test/**', 'node_modules/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  unicorn.configs['flat/recommended'],
  promise.configs['flat/recommended'],
  {
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      complexity: ['error', { max: 25 }],
      'max-lines-per-function': ['error', { max: 150, skipBlankLines: true, skipComments: true }],
      'max-depth': ['error', 5],
      'max-params': ['error', 4],
      'no-param-reassign': ['error', { props: false }],
      eqeqeq: ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'error',
      'consistent-return': 'error',
      'default-case': 'error',
      'no-await-in-loop': 'error',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],

      'unicorn/prefer-module': 'off',
      'unicorn/prevent-abbreviations': 'off',
      'unicorn/no-null': 'off',
      // The `cause` name lets us use { cause } shorthand in `new Error(msg, { cause })`.
      'unicorn/catch-error-name': 'off',
      // The `parse` function deliberately converts a Promise chain back to a Node-style
      // callback API; calling the callback inside .then/.catch is the entire point.
      'promise/no-callback-in-promise': 'off',
    },
  },
  prettier,
];
