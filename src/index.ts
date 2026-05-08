import fs from 'node:fs';
import tags from './tags.js';

type IfdTagName = (typeof tags.ifd)[keyof typeof tags.ifd];
type GpsTagName = (typeof tags.gps)[keyof typeof tags.gps];

export type TagName = IfdTagName | GpsTagName;
export type ExifValue = string | number | number[];
export type ExifData = {
  [tag in TagName]?: ExifValue;
} & {
  SubExif?: ExifData;
  GPSInfo?: ExifData;
};
export type ParseCallback = (err: Error | undefined, data?: ExifData) => void;

type TagCollection = Readonly<Record<string, TagName>>;

const bytes = [0, 1, 1, 2, 4, 8, 1, 1, 2, 4, 8, 4, 8] as const;
const SOIMarkerLength = 2;
const JPEGSOIMarker = 0xff_d8;
const TIFFINTEL = 0x49_49;
const TIFFMOTOROLA = 0x4d_4d;
const APPMarkerLength = 2;
const APPMarkerBegin = 0xff_e0;
const APPMarkerEnd = 0xff_ef;

let data: ExifData | undefined;

const isValid = (buffer: Buffer): boolean => {
  try {
    const SOIMarker = buffer.readUInt16BE(0);
    return SOIMarker === JPEGSOIMarker;
  } catch (cause) {
    throw new Error('Unsupport file format.', { cause });
  }
};

const isTiff = (buffer: Buffer): boolean => {
  try {
    const SOIMarker = buffer.readUInt16BE(0);
    return SOIMarker === TIFFINTEL || SOIMarker === TIFFMOTOROLA;
  } catch (cause) {
    throw new Error('Unsupport file format.', { cause });
  }
};

const checkAPPn = (buffer: Buffer): number | false => {
  try {
    const APPMarkerTag = buffer.readUInt16BE(0);
    const isInRange = APPMarkerTag >= APPMarkerBegin && APPMarkerTag <= APPMarkerEnd;
    return isInRange ? APPMarkerTag - APPMarkerBegin : false;
  } catch (cause) {
    throw new Error('Invalid APP Tag.', { cause });
  }
};

const readTagValue = (dataFormat: number, dataValue: Buffer, order: boolean, tagName: TagName): ExifValue => {
  switch (dataFormat) {
    case 1: {
      return dataValue.readUInt8(0);
    }
    case 2: {
      return dataValue.toString('ascii').replace(/\0+$/, '');
    }
    case 3: {
      return order ? dataValue.readUInt16BE(0) : dataValue.readUInt16LE(0);
    }
    case 4: {
      return order ? dataValue.readUInt32BE(0) : dataValue.readUInt32LE(0);
    }
    case 5: {
      const result: number[] = [];
      for (let i = 0; i < dataValue.length; i += 8) {
        const bigTagValue = dataValue.readUInt32BE(i) / dataValue.readUInt32BE(i + 4);
        const littleTagValue = dataValue.readUInt32LE(i) / dataValue.readUInt32LE(i + 4);
        result.push(order ? bigTagValue : littleTagValue);
      }
      return result;
    }
    case 7: {
      switch (tagName) {
        case 'ExifVersion': {
          return dataValue.toString();
        }
        case 'SceneType': {
          return dataValue.readUInt8(0);
        }
        default: {
          return `0x${dataValue.toString('hex', 0, 15)}`;
        }
      }
    }
    case 10: {
      const bigOrder = dataValue.readInt32BE(0) / dataValue.readInt32BE(4);
      const littleOrder = dataValue.readInt32LE(0) / dataValue.readInt32LE(4);
      return order ? bigOrder : littleOrder;
    }
    default: {
      return `0x${dataValue.toString('hex')}`;
    }
  }
};

const IFDHandler = (buffer: Buffer, tagCollection: TagCollection, order: boolean, offset: number): ExifData => {
  const entriesNumber = order ? buffer.readUInt16BE(0) : buffer.readUInt16LE(0);

  if (entriesNumber === 0) {
    return {};
  }

  const entriesNumberLength = 2;
  const entries = buffer.slice(entriesNumberLength);
  const entryLength = 12;
  const exif: ExifData = {};

  for (let entryCount = 0; entryCount < entriesNumber; entryCount += 1) {
    const entryBegin = entryCount * entryLength;
    const entry = entries.slice(entryBegin, entryBegin + entryLength);
    const tagBegin = 0;
    const tagLength = 2;
    const dataFormatBegin = tagBegin + tagLength;
    const dataFormatLength = 2;
    const componentsBegin = dataFormatBegin + dataFormatLength;
    const componentsNumberLength = 4;
    const dataValueBegin = componentsBegin + componentsNumberLength;
    const dataValueLength = 4;
    const tagAddress = entry.slice(tagBegin, dataFormatBegin);
    const tagNumber = order ? tagAddress.toString('hex') : Buffer.from(tagAddress.toReversed()).toString('hex');
    const tagName = tagCollection[tagNumber];
    if (!tagName) continue;

    const bigDataFormat = entry.readUInt16BE(dataFormatBegin);
    const littleDataFormat = entry.readUInt16LE(dataFormatBegin);
    const dataFormat = order ? bigDataFormat : littleDataFormat;
    const componentsByte = bytes[dataFormat];
    const bigComponentsNumber = entry.readUInt32BE(componentsBegin);
    const littleComponentNumber = entry.readUInt32LE(componentsBegin);
    const componentsNumber = order ? bigComponentsNumber : littleComponentNumber;
    const dataLength = componentsByte === undefined ? 0 : componentsNumber * componentsByte;
    let dataValue = entry.slice(dataValueBegin, dataValueBegin + dataValueLength);

    if (dataLength > 4) {
      const dataOffset = (order ? dataValue.readUInt32BE(0) : dataValue.readUInt32LE(0)) - offset;
      dataValue = buffer.slice(dataOffset, dataOffset + dataLength);
    }

    exif[tagName] = readTagValue(dataFormat, dataValue, order, tagName);
  }
  return exif;
};

const trimEXIFHeader = (buf: Buffer): Buffer => {
  const headerStripped = buf.slice(APPMarkerLength);
  const length = headerStripped.readUInt16BE(0);
  const trimmed = headerStripped.slice(0, length);
  const lengthLength = 2;
  const identifierLength = 5;
  const padLength = 1;
  return trimmed.slice(lengthLength + identifierLength + padLength);
};

const EXIFHandler = (buf: Buffer, pad = true): void => {
  let buffer = pad ? trimEXIFHeader(buf) : buf;

  const byteOrderLength = 2;
  const byteOrder = buffer.toString('ascii', 0, byteOrderLength) === 'MM';
  const fortyTwoLength = 2;
  const fortyTwoEnd = byteOrderLength + fortyTwoLength;
  const big42 = buffer.readUInt32BE(fortyTwoEnd);
  const little42 = buffer.readUInt32LE(fortyTwoEnd);
  const offsetOfIFD = byteOrder ? big42 : little42;

  buffer = buffer.slice(offsetOfIFD);
  if (buffer.length === 0) return;

  data = IFDHandler(buffer, tags.ifd, byteOrder, offsetOfIFD);

  const exifPointer = data.ExifIFDPointer;
  if (typeof exifPointer === 'number') {
    buffer = buffer.slice(exifPointer - offsetOfIFD);
    data.SubExif = IFDHandler(buffer, tags.ifd, byteOrder, exifPointer);
  }

  const gpsPointer = data.GPSInfoIFDPointer;
  if (typeof gpsPointer === 'number') {
    const offsetBase = typeof exifPointer === 'number' ? exifPointer : offsetOfIFD;
    buffer = buffer.slice(gpsPointer - offsetBase);
    data.GPSInfo = IFDHandler(buffer, tags.gps, byteOrder, gpsPointer);
  }
};

const APPnHandler = (buffer: Buffer): void => {
  const APPMarkerTag = checkAPPn(buffer);
  if (APPMarkerTag === false) return;

  const length = buffer.readUInt16BE(APPMarkerLength);
  if (APPMarkerTag === 1) {
    EXIFHandler(buffer);
  } else {
    APPnHandler(buffer.slice(APPMarkerLength + length));
  }
};

export const fromBuffer = (buffer: Buffer): ExifData | undefined => {
  if (!buffer) {
    throw new Error('buffer not found');
  }

  data = undefined;

  if (isValid(buffer)) {
    const trimmed = buffer.slice(SOIMarkerLength);
    data = {};
    APPnHandler(trimmed);
  } else if (isTiff(buffer)) {
    data = {};
    EXIFHandler(buffer, false);
  }

  return data;
};

export const parseSync = (file: string): ExifData | undefined => {
  if (!file) {
    throw new Error('File not found');
  }
  const buffer = fs.readFileSync(file);
  return fromBuffer(buffer);
};

const parseInternal = (file: string): Promise<ExifData> =>
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
        if (isValid(buffer)) {
          const buf = buffer.slice(SOIMarkerLength);
          data = {};
          APPnHandler(buf);
          resolve(data);
        } else if (isTiff(buffer)) {
          data = {};
          EXIFHandler(buffer, false);
          resolve(data);
        } else {
          reject(new Error('😱Unsupport file type.'));
        }
      } catch (cause) {
        reject(cause instanceof Error ? cause : new Error(String(cause)));
      }
    });
  });

export const parse = (file: string, callback: ParseCallback): void => {
  data = undefined;
  parseInternal(file)
    .then((d) => callback(undefined, d))
    .catch((error: Error) => callback(error));
};

export const parsePromise = (file: string): Promise<ExifData> => {
  data = undefined;
  return parseInternal(file);
};
