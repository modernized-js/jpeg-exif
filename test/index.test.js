const fs = require('node:fs');
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const exif = require('../src/index.js');

const parseAsync = (file) =>
  new Promise((resolve, reject) => {
    exif.parse(file, (err, data) => (err ? reject(err) : resolve(data)));
  });

describe('.parse()', () => {
  it('file {undefined}', async () => {
    await assert.rejects(parseAsync(undefined), Error);
  });

  it('file {null}', async () => {
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

  it('!(APP1:#0xffe1||APP0:#0xffe0)', async () => {
    await assert.rejects(parseAsync('./test/index.test.js'), Error);
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

describe('.parseSync()', () => {
  it('file {undefined}', () => {
    assert.throws(() => exif.parseSync(), Error);
  });

  it('file {null}', () => {
    assert.throws(() => exif.parseSync(), Error);
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
    assert.strictEqual(typeof data.SubExif, 'object');
  });

  it('[GPSInfo]', () => {
    const data = exif.parseSync('./test/IMG_0001.JPG');
    assert.strictEqual(typeof data.GPSInfo, 'object');
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
  it('file {undefined}', () => {
    assert.throws(() => exif.fromBuffer(), Error);
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
    assert.strictEqual(typeof data.SubExif, 'object');
  });

  it('[GPSInfo]', () => {
    const buffer = fs.readFileSync('./test/IMG_0001.JPG');
    const data = exif.fromBuffer(buffer);
    assert.strictEqual(typeof data.GPSInfo, 'object');
  });
});
