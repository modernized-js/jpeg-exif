# @modernized/jpeg-exif

Get exif information from JPEG files. Works with TIFF too.

> **Fork notice.** This is a maintained fork of [`jpeg-exif`](https://www.npmjs.com/package/jpeg-exif) ([zhso/jpeg-exif](https://github.com/zhso/jpeg-exif)), which is deprecated on npm and whose GitHub repository has been removed. The public API (`parse`, `parseSync`, `fromBuffer`) is **fully compatible** — you should be able to swap `jpeg-exif` for `@modernized/jpeg-exif` without any code changes.
>
> What's new in the fork: modern toolchain (Node ≥ 22, `node:test`, ESLint 9, Prettier), CI on Linux / macOS / Windows × Node 22 / 24, and ongoing modernization (TypeScript migration and a Promise-returning `parse` are planned).

## Installation

```bash
yarn add @modernized/jpeg-exif
# or
npm i @modernized/jpeg-exif
```

## Usage

### Async (callback)

```js
import exif from '@modernized/jpeg-exif';

const filePath = '~/Photo/IMG_0001.JPG';

exif.parse(filePath, (err, data) => {
  if (err) {
    console.log(err);
  } else {
    console.log(data);
  }
});
```

### Sync

```js
import exif from '@modernized/jpeg-exif';

const filePath = '~/Photo/IMG_0001.JPG';
const data = exif.parseSync(filePath);

console.log(data);
```

### From Buffer

```js
import fs from 'node:fs';
import exif from '@modernized/jpeg-exif';

const filePath = '~/Documents/DOC_0001.TIFF';
const buffer = fs.readFileSync(filePath);
const data = exif.fromBuffer(buffer);

console.log(data);
```

## Features

- Supports all CP3451 Standard Tags (including GPS & SubExif tags)
- Sync and async APIs
- Accepts a `Buffer` directly

## Returned Data Shape

```js
{
    "Make": "Apple",
    "Model": "Apple",
    //...
    "SubExif": [
        "DateTimeOriginal": "2015:10:06 17:19:36",
        "CreateDate": "2015:10:06 17:19:36",
        //...
    ],
    "GPSInfo": [
        "GPSLatitudeRef": "N",
        "GPSLatitude": [ 35, 39, 40.08 ],
        //...
    ]
}
```

## License

MIT — original work © zhso. Fork modifications © contributors. See `LICENSE.txt`.
