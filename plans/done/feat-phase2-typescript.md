# Plan: TypeScript migration (Phase 2)

Tracking issue: #7

## Strategy

1. **Rename via `git mv` in dedicated commits.** Two commits with no content change so the rename has 100% similarity, ensuring `git log --follow` traces history cleanly:
   - Commit A: `git mv src/index.js src/index.ts`
   - Commit B: `git mv test/index.test.js test/index.test.ts`
2. **One implementation commit** that adds tooling, converts content, and wires up dual builds.
3. **One plan-tidy commit** moving the Phase 1.5 plan to `plans/done/`.

## Decisions

| Topic                     | Choice                                                                                                                            | Why                                                                                                              |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Build tool                | `tsc` (no bundler)                                                                                                                | Ships only the artifacts we author; minimal moving parts.                                                        |
| Module shape              | Dual ESM + CJS via two `tsc` invocations + an `esm/package.json` shim with `"type": "module"`                                     | Ecosystem-standard; works with Node's exports field.                                                             |
| `tags.json` / `plus.json` | Converted to `tags.ts` / `plus.ts` with `as const`                                                                                | Removes the need to copy JSON to dist at build time, and lets us derive `TagName` types from the literal values. |
| Test format               | `.ts` compiled by `tsc` into `dist-test/`, then `node --test` runs the compiled JS                                                | Matches the user's request and avoids `--experimental-strip-types`.                                              |
| Source layout             | Single `src/index.ts`                                                                                                             | Phase 2's main goal is TS migration + build pipeline. File splitting is deferred.                                |
| Promise API               | New function **`parsePromise(file)`**                                                                                             | Names callback vs Promise paths clearly. `fs.promises`-style.                                                    |
| Type strictness           | `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`. No `any`, no `as` (per CLAUDE.md).          | User asked for ガチガチ.                                                                                         |
| Tag-name typing           | `type TagName = (typeof tags.ifd)[keyof typeof tags.ifd] \| (typeof tags.gps)[keyof typeof tags.gps] \| ...` over `as const` data | Names like `Make`, `Model`, `GPSLatitude` flow into the result type without hand-listing them.                   |
| Public API                | `parse`, `parseSync`, `fromBuffer` keep their existing signatures and observable behavior. **`parsePromise` is purely additive.** | Drop-in compatibility, as advertised in the README.                                                              |
| `engines.node`            | `>=22` (unchanged)                                                                                                                | Matches CI matrix.                                                                                               |

## File plan

### Added

- `tsconfig.json` — base config (strict, used by `tsc --noEmit` for typecheck)
- `tsconfig.cjs.json` — emits CJS into `dist/cjs/` (`module: CommonJS` + `moduleResolution: Node10` + `ignoreDeprecations: "6.0"` for the TS 6.0 deprecation warning)
- `tsconfig.esm.json` — emits ESM into `dist/esm/` (`module: ES2022` + `moduleResolution: Bundler` so tsc emits real ESM regardless of root `package.json` type)
- `tsconfig.test.json` — emits test build into `dist-test/`
- `src/tags.ts`, `src/plus.ts` — `as const` modules (replace JSON files)

The build is fully driven by `package.json` scripts using inline `node -e` for the cross-platform clean and ESM/CJS `package.json` shim writes — no separate build script file, and no extra build dep (no `tsup`, no `c8`).

### Removed

- `src/tags.json`, `src/plus.json`

### Modified

- `src/index.ts` (TS conversion, types, `parsePromise`)
- `test/index.test.ts` (TS imports, add a `parsePromise` test, switch to compiled-source layout)
- `package.json` (devDeps, scripts, `main` / `module` / `types` / `exports` / `files`, `prepack`)
- `eslint.config.mjs` (typescript-eslint integration)
- `.gitignore` (add `dist/`, `dist-test/`)
- `.prettierignore` (already covers `dist/`)
- `.github/workflows/ci.yml` (add `typecheck` and `build` steps)

## CI step ordering

`yarn install --frozen-lockfile → yarn lint → yarn format:check → yarn typecheck → yarn build → yarn test`

`yarn test` depends on `yarn build` (specifically the test-build) being run beforehand; the workflow does so explicitly.

## Out of scope

- File-splitting refactor (Phase 3 candidate).
- Tightening the `complexity` and `max-lines-per-function` thresholds Phase 1.5 had to soften.
- Coverage threshold enforcement.
