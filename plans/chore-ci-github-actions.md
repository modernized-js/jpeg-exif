# Plan: Add GitHub Actions CI for lint and build

Tracking issue: #1

## Goal

Run `yarn lint` and `yarn build` on every push to `main` and every pull request, across Node.js 22 / 24 on Linux / Windows / macOS.

## Decisions

| Topic | Choice | Why |
| --- | --- | --- |
| Action versions | `actions/checkout@v6`, `actions/setup-node@v6` | Per user instruction; both confirmed to exist on GitHub. |
| Node matrix | 22, 24 | Per user instruction. |
| OS matrix | ubuntu-latest, windows-latest, macos-latest | Per user instruction. |
| Test step | **Excluded** | `yarn test` uploads to coveralls.io and needs `COVERALLS_REPO_TOKEN`; out of scope. |
| Lint script | Drop `--fix` | CI must fail on lint errors, not silently auto-fix. |
| Shell | `bash` on all OS | The existing `lint` (`./node_modules/.bin/eslint …`) and `build` (`cp ./src/*.json ./lib`) scripts are Unix-style. Forcing bash on Windows (via Git Bash, pre-installed) avoids modifying these scripts beyond the `--fix` removal. |
| `yarn install` flags | bare `yarn install` (no `--frozen-lockfile`) | No `yarn.lock` is committed yet; can be tightened later. |
| Trigger | `push` on `main`, `pull_request` | Standard. |
| `fail-fast` | `false` | Show all matrix failures so we don't lose signal from one shard breaking. |

## Steps

1. Add `.github/workflows/ci.yml` with the matrix described above.
2. Edit `package.json`: remove `--fix` from the `lint` script.
3. Open PR. Verify all 6 matrix legs pass; iterate if any fail.

## Out of scope

- Modernizing devDependencies (babel 6, eslint 6, mocha 6, istanbul 0.4).
- Coveralls integration / running tests in CI.
- `.gitattributes` for line-ending normalization (only relevant once Windows test runs are added).
- Dependabot / release automation.
