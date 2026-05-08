import fs from 'node:fs';
import { isValid, isTiff, SOIMarkerLength } from './format.js';
import { APPnHandler, EXIFHandler } from './exif-walker.js';
import type { ExifData, ParseCallback } from './types.js';

export const parseFromBuffer = (buffer: Buffer): ExifData | undefined => {
  if (!buffer) {
    throw new Error('buffer not found');
  }
  if (isValid(buffer)) {
    return APPnHandler(buffer.slice(SOIMarkerLength)) ?? {};
  }
  if (isTiff(buffer)) {
    return EXIFHandler(buffer, false);
  }
  return undefined;
};

export const parseSync = (file: string): ExifData | undefined => {
  if (!file) {
    throw new Error('File not found');
  }
  return parseFromBuffer(fs.readFileSync(file));
};

export const parseFile = (file: string): Promise<ExifData> =>
  new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('❓File not found.'));
      return;
    }
    fs.readFile(file, (err, buffer) => {
      if (err) {
        reject(err);
        return;
      }
      try {
        const result = parseFromBuffer(buffer);
        if (result === undefined) {
          reject(new Error('😱Unsupport file type.'));
          return;
        }
        resolve(result);
      } catch (cause) {
        reject(cause instanceof Error ? cause : new Error(String(cause)));
      }
    });
  });

export const parse = (file: string, callback: ParseCallback): void => {
  parseFile(file)
    .then((d) => callback(undefined, d))
    .catch((error: Error) => callback(error));
};
