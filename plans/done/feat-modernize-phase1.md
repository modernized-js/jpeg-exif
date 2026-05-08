# Plan: Modernize toolchain (Phase 1)

Tracking issue: #3

## Scope

Toolchain only. `src/index.js` is touched **minimally** (one ESM `import` left over from Babel must become `require`, and three `catch (e)` blocks need `cause` for ESLint recommended); strict lint rules and TS rewrite are explicitly out of scope.

Also in this PR (per user follow-ups during the session):

- Rename the package to `@modernized/jpeg-exif` and point `homepage` / `repository` / `bugs` at `https://github.com/isamu/jpeg-exif`.
- Update README to mark the package as a fork of [`jpeg-exif`](https://www.npmjs.com/package/jpeg-exif), link to the original, and state that the public API is fully compatible (drop-in replacement).

## Decisions

| Topic                     | Choice                                                  | Why                                                                                                                           |
| ------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Test framework            | `node:test` + `node:assert`                             | CLAUDE.md mandates Node native testing. Drops mocha/chai.                                                                     |
| Coverage                  | `c8`                                                    | Built on V8 native coverage; no babel/istanbul stack. Optional `yarn coverage` script.                                        |
| Lint level                | ESLint 9 flat config, **recommended only**              | User asked to introduce loosely first. Strict rules + source fixes are a separate PR (Phase 1.5) so the diffs are reviewable. |
| Format                    | Prettier defaults                                       | Adds `yarn format` and `yarn format:check`. CI runs `format:check`.                                                           |
| Build                     | **Removed in Phase 1**                                  | Babel goes; `main` points at `src/index.js`. Phase 2 reintroduces a `dist/` build via `tsc`.                                  |
| `lib/` directory          | Deleted                                                 | Phase 2 will produce `dist/` instead. Avoids stale committed build output.                                                    |
| `.babelrc`, `.travis.yml` | Deleted                                                 | Babel is gone; Travis is replaced by GitHub Actions.                                                                          |
| `yarn.lock`               | Committed                                               | Re-enables `cache: yarn` in `setup-node@v6` and pins reproducibility.                                                         |
| `engines.node`            | `>=22`                                                  | Matches CI matrix and uses `node:test` features available there.                                                              |
| Plan tidy                 | Move `plans/chore-ci-github-actions.md` → `plans/done/` | Follow-up to PR #2 merge. Bundled here to avoid a stand-alone chore PR.                                                       |

## Steps

1. Branch `feat/modernize-phase1-deps-and-tests` (done).
2. Delete: `.babelrc`, `.travis.yml`, `.eslintrc.json`, `lib/index.js`, `lib/index.js.map`, `lib/plus.json`, `lib/tags.json`.
3. Add: `.gitignore`, `.prettierrc`, `.prettierignore`, `eslint.config.js`.
4. Edit `package.json`: deps, scripts, `main`, `engines`.
5. Migrate `test/index.test.js` to `node:test` + `node:assert`. Update import target to `../src/index.js`.
6. `yarn install` — creates `yarn.lock`.
7. Run `yarn format`, `yarn lint`, `yarn test` locally; iterate until green.
8. Update `.github/workflows/ci.yml`: re-enable `cache: yarn`, replace the `build` step with `format:check` + `test`.
9. `git mv plans/chore-ci-github-actions.md plans/done/chore-ci-github-actions.md`.
10. Commit (logically grouped), push, open PR.

## Open follow-ups (not this PR)

- **Phase 1.5**: tighten ESLint with `eslint-plugin-unicorn`, `eslint-plugin-promise`, `complexity`, `max-lines-per-function`, `max-depth`, `no-param-reassign`, etc., and fix the source violations. Will revisit `no-bitwise` (the parser uses bit-level ops legitimately).
- **Phase 2**: TypeScript migration, dual ESM/CJS publish via `dist/`, add Promise variant of `parse()`.
  - **Use `git mv src/index.js src/index.ts`** so the rename is recorded in history and `git log --follow` keeps working. Same for `test/index.test.js`. Don't recreate the file — let the rename be a single commit, then a separate commit for the TS conversion edits.
