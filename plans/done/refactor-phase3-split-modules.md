# Plan: Split src/index.ts into modules and tighten lint (Phase 3)

Tracking issue: #9

## Strategy

1. Refactor first, lint-tighten second. The split makes IFDHandler small enough to fit aggressive thresholds; tightening before the split would just force inline disables.
2. Drop the module-level `let data: ExifData | undefined`. Replace mutation with explicit return values. This is the deepest behavioral change in this PR and the reason the split is worth doing.
3. Public API surface (`parse / parseSync / fromBuffer / parsePromise`) is byte-identical to Phase 2 from the caller's POV.

## Module layout (target)

| File                         | Contents                                                                                                                                                                  |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/index.ts`               | Public API — re-exports `parse`, `parsePromise`, `parseSync`, `fromBuffer` and the public types. Nothing else.                                                            |
| `src/parser.ts`              | `parseFromBuffer(buffer): ExifData \| undefined` (sync) and `parseFile(file): Promise<ExifData>` (async). The shared internal logic both `parse` and `parsePromise` call. |
| `src/exif-walker.ts`         | `EXIFHandler`, `APPnHandler`, `trimEXIFHeader`. APP-marker walking and the EXIF block layout.                                                                             |
| `src/ifd-handler.ts`         | `IFDHandler` and `parseIFDEntry` (extracted from the inner loop), plus the `readTagValue` switch.                                                                         |
| `src/format.ts`              | `isValid`, `isTiff`, `checkAPPn`, the `bytes` lookup, and the magic-number constants (`JPEGSOIMarker`, `TIFFINTEL`, etc.).                                                |
| `src/types.ts`               | `ExifData`, `ExifValue`, `TagName`, `ParseCallback`, `TagCollection`.                                                                                                     |
| `src/tags.ts`, `src/plus.ts` | Unchanged.                                                                                                                                                                |

## Behavioral preservation

The existing tests expect that calling `parseSync('./test/IMG_0003.JPG')` (a JPEG with APP0/JFIF only, no APP1/EXIF block) returns an empty object, not `undefined`. The refactored `parseFromBuffer` keeps this with `?? {}` after the APP walk so non-EXIF JPEGs still resolve to `{}`. Non-JPEG/non-TIFF inputs return `undefined` (sync) and reject with `Unsupport file type` (async), matching Phase 2.

## Lint tightenings

| Rule                     | Before | After  |
| ------------------------ | ------ | ------ |
| `complexity`             | 25     | **15** |
| `max-lines-per-function` | 150    | **50** |
| `max-depth`              | 5      | **4**  |

If the post-split modules don't fit cleanly, the threshold is raised back rather than disabling the rule. Numbers are documented here as the chosen ceiling, not the inherent quality bar.

## Steps

1. Create `src/types.ts` with the type definitions (no logic change).
2. Create `src/format.ts` with the detection helpers + constants.
3. Create `src/ifd-handler.ts` with `IFDHandler` + extracted `parseIFDEntry` + `readTagValue`.
4. Create `src/exif-walker.ts` with `EXIFHandler` + `APPnHandler` + `trimEXIFHeader`. Convert each to return `ExifData`.
5. Create `src/parser.ts` with `parseFromBuffer` and `parseFile`.
6. Reduce `src/index.ts` to public re-exports + the callback-style `parse` wrapper that delegates to `parseFile`.
7. Run `yarn typecheck`, `yarn lint`, `yarn build`, `yarn test` after each step.
8. Tighten ESLint thresholds and adjust if any function trips them.
9. Move `plans/feat-phase2-typescript.md` to `plans/done/` (follow-up tidy from #8).

## Out of scope

- TypeScript 7 deprecation cleanup (next PR).
- Coverage threshold enforcement.
- npm publish wiring.
