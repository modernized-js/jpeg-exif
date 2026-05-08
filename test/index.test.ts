import fs from 'node:fs';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as exif from '../src/index.js';
import type { ExifData } from '../src/index.js';

const parseAsync = (file: string): Promise<ExifData> =>
  new Promise((resolve, reject) => {
    exif.parse(file, (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      if (!data) {
        reject(new Error('parse resolved without data'));
        return;
      }
      resolve(data);
    });
  });

describe('.parse()', () => {
  it('rejects on empty file path', async () => {
    await assert.rejects(parseAsync(''), Error);
  });

  it('rejects on missing file', async () => {
    await assert.rejects(parseAsync('./test/null.jpg'), Error);
  });

  it('APP1:#0xffe1', async () => {
    const data = await parseAsync('./test/IMG_0001.JPG');
    assert.strictEqual(typeof data, 'object');
  });

  it('APP0:#0xffe0', async () => {
    const data = await parseAsync('./test/IMG_0003.JPG');
    assert.strictEqual(typeof data, 'object');
  });

  it('rejects on unsupported file', async () => {
    await assert.rejects(parseAsync('./test/index.test.ts'), Error);
  });

  it('[SubExif]', async () => {
    const data = await parseAsync('./test/IMG_0001.JPG');
    assert.strictEqual(typeof data.SubExif, 'object');
  });

  it('[GPSInfo]', async () => {
    const data = await parseAsync('./test/IMG_0001.JPG');
    assert.strictEqual(typeof data.GPSInfo, 'object');
  });
});

describe('.parsePromise()', () => {
  it('rejects on empty file path', async () => {
    await assert.rejects(exif.parsePromise(''), Error);
  });

  it('rejects on missing file', async () => {
    await assert.rejects(exif.parsePromise('./test/null.jpg'), Error);
  });

  it('resolves with EXIF data for a JPEG with APP1', async () => {
    const data = await exif.parsePromise('./test/IMG_0001.JPG');
    assert.strictEqual(typeof data, 'object');
    assert.strictEqual(typeof data.SubExif, 'object');
    assert.strictEqual(typeof data.GPSInfo, 'object');
  });

  it('rejects on unsupported file', async () => {
    await assert.rejects(exif.parsePromise('./test/index.test.ts'), Error);
  });
});

describe('.parseSync()', () => {
  it('throws on empty file path', () => {
    assert.throws(() => exif.parseSync(''), Error);
  });

  it('APP1:#0xffe1', () => {
    const data = exif.parseSync('./test/IMG_0001.JPG');
    assert.strictEqual(typeof data, 'object');
  });

  it('!APP1:#0xffe1', () => {
    const data = exif.parseSync('./test/IMG_0003.JPG');
    assert.strictEqual(typeof data, 'object');
  });

  it('[SubExif]', () => {
    const data = exif.parseSync('./test/IMG_0001.JPG');
    assert.strictEqual(typeof data?.SubExif, 'object');
  });

  it('[GPSInfo]', () => {
    const data = exif.parseSync('./test/IMG_0001.JPG');
    assert.strictEqual(typeof data?.GPSInfo, 'object');
  });

  it('TIFF', () => {
    const data = exif.parseSync('./test/Arbitro.tiff');
    assert.deepStrictEqual(data, {
      ImageWidth: 174,
      ImageHeight: 38,
      BitsPerSample: 8,
      Compression: 5,
      PhotometricInterpretation: 2,
      StripOffsets: 8,
      Orientation: 1,
      SamplesPerPixel: 4,
      RowsPerStrip: 38,
      StripByteCounts: 6391,
      PlanarConfiguration: 1,
    });
  });
});

describe('.fromBuffer()', () => {
  it('throws on empty buffer', () => {
    assert.throws(() => exif.fromBuffer(Buffer.alloc(0)), Error);
  });

  it('APP1:#0xffe1', () => {
    const buffer = fs.readFileSync('./test/IMG_0001.JPG');
    const data = exif.fromBuffer(buffer);
    assert.strictEqual(typeof data, 'object');
  });

  it('!APP1:#0xffe1', () => {
    const buffer = fs.readFileSync('./test/IMG_0003.JPG');
    const data = exif.fromBuffer(buffer);
    assert.strictEqual(typeof data, 'object');
  });

  it('[SubExif]', () => {
    const buffer = fs.readFileSync('./test/IMG_0001.JPG');
    const data = exif.fromBuffer(buffer);
    assert.strictEqual(typeof data?.SubExif, 'object');
  });

  it('[GPSInfo]', () => {
    const buffer = fs.readFileSync('./test/IMG_0001.JPG');
    const data = exif.fromBuffer(buffer);
    assert.strictEqual(typeof data?.GPSInfo, 'object');
  });
});
