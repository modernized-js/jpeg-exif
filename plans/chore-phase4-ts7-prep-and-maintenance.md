# Plan: TypeScript 7 prep + maintenance setup (Phase 4)

Tracking issue: #11

## Decisions

| Topic                                    | Choice                                         | Why                                                                                                                                                                            |
| ---------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `moduleResolution` for CJS / test builds | `Node16` (was `Node10` + `ignoreDeprecations`) | TypeScript 7 will remove `Node10`. `Node16` is the documented modern Node-compatible value. The base `tsconfig.json` already uses `NodeNext`.                                  |
| `module` for CJS build                   | `Node16` (was `CommonJS`)                      | Pairs with `moduleResolution: Node16`. tsc decides emit format from the closest `package.json` `type` field; the root has no `type` (= CJS), so the CJS build still emits CJS. |
| Dependabot groups                        | Group ESLint family + TypeScript family        | Avoids one PR per `eslint-plugin-*` bump.                                                                                                                                      |
| Coverage thresholds                      | `lines: 90`, `branches: 70`, `functions: 90`   | Current actual is `97.65 / 77.23 / 100`. Thresholds give some headroom but lock in the floor.                                                                                  |
| CI test step                             | Replace `yarn test` with `yarn coverage:check` | Single step that gates on both pass/fail and coverage. `precoverage:check: yarn build:test` keeps the build chain clean.                                                       |
| Per-platform coverage                    | All 6 matrix legs run with coverage            | Tiny overhead for 22 tests; keeps the workflow uniform.                                                                                                                        |

## Steps

1. Update `tsconfig.cjs.json` and `tsconfig.test.json`: `module: Node16`, `moduleResolution: Node16`, drop `ignoreDeprecations`.
2. Add `.github/dependabot.yml` with grouped weekly updates.
3. Add `coverage:check` and `precoverage:check` scripts in `package.json`.
4. Replace the CI `Test` step with `Test (with coverage threshold)` calling `yarn coverage:check`.
5. Move `plans/refactor-phase3-split-modules.md` to `plans/done/`.

## Out of scope

- npm publish wiring (next PR).
- Pushing coverage higher — thresholds match current numbers; this PR is about the gate, not the bar.
- README badge for coverage.
