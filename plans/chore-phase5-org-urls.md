# Plan: switch URLs to modernized-js org (Phase 5)

Tracking issue: #13

## Context

The repository was transferred from `isamu/jpeg-exif` to `modernized-js/jpeg-exif` via:

```bash
gh api repos/isamu/jpeg-exif/transfer -f new_owner=modernized-js
```

Post-transfer, GitHub redirects the old URL for a while, but the in-repo metadata (`package.json`, `README.md`) still pointed at `isamu`. This PR aligns the metadata.

## Changes

| File                                                             | Change                                                               |
| ---------------------------------------------------------------- | -------------------------------------------------------------------- |
| `package.json`                                                   | `homepage`, `repository.url`, `bugs.url` → `modernized-js/jpeg-exif` |
| `README.md`                                                      | Fork notice gets a `Maintained at modernized-js/jpeg-exif` mention   |
| `plans/chore-phase4-ts7-prep-and-maintenance.md` → `plans/done/` | Phase 4 tidy                                                         |

## Out of scope

- Author / contributors fields stay as-is. `isamu` is the human author; `modernized-js` is the host.
- npm publish wiring (release workflow + first 2.0.0 release) — separate PR.
