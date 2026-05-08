export type { ExifData, ExifValue, TagName, ParseCallback } from './types.js';
export { parseFromBuffer as fromBuffer, parseFile as parsePromise, parseSync, parse } from './parser.js';
