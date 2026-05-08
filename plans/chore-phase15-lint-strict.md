# Plan: Tighten ESLint and fix source violations (Phase 1.5)

Tracking issue: #5

## Strategy

1. Add the strict plugins and rules to `eslint.config.mjs`.
2. Run `yarn lint`. Count and categorize the violations.
3. Decide per-rule whether to:
   - Refactor source to comply (preferred for new-code patterns: `prefer-const`, `eqeqeq`, `no-var`, `no-await-in-loop`, etc.).
   - Soften the rule's threshold to fit the parser code (`max-lines-per-function`, `complexity`) — track the looser-than-ideal limit in this plan so Phase 2 can tighten on the TS rewrite.
   - Per-file disable with a written reason (only as a last resort).
4. Re-run `yarn format`, `yarn lint`, `yarn test`. All must pass.

## Plugin config sketch

```js
// eslint.config.mjs
import js from '@eslint/js';
import unicorn from 'eslint-plugin-unicorn';
import promise from 'eslint-plugin-promise';
import prettier from 'eslint-config-prettier/flat';
import globals from 'globals';

export default [
  js.configs.recommended,
  unicorn.configs['flat/recommended'],
  promise.configs['flat/recommended'],
  {
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'commonjs',
      globals: { ...globals.node },
    },
    rules: {
      // Core tightenings
      complexity: ['error', { max: 25 }], // raised from 20 to fit IFDHandler; tighten in Phase 2
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
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],

      // Disable unicorn rules that fight CJS / readability
      'unicorn/prefer-module': 'off', // we are CJS until Phase 2
      'unicorn/prevent-abbreviations': 'off', // would flag buf, cb, e, fn, etc.
      'unicorn/no-null': 'off', // standard JS
    },
  },
  prettier,
];
```

The `complexity` and `max-lines-per-function` numbers are deliberately set above the strict ideal because the existing parser (`IFDHandler`) is dense. Phase 2's TS rewrite is the right time to break it apart.

## Steps

1. `yarn add --dev eslint-plugin-unicorn eslint-plugin-promise`.
2. Update `eslint.config.mjs` with the strict config.
3. `yarn lint` → triage violations.
4. Refactor / configure as described above.
5. `yarn format` to keep Prettier happy.
6. `yarn test` to ensure no regressions in the 19-test suite.
7. Update CI? No — workflow already runs `lint`, `format:check`, `test`.
8. Move `plans/feat-modernize-phase1.md` → `plans/done/`.
9. Commit, push, open PR.

## Out of scope

- TypeScript migration (Phase 2).
- Public API changes.
- Coverage threshold enforcement (`c8` exists but no threshold yet).
