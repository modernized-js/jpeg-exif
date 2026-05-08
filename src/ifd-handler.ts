import { bytes } from './format.js';
import type { ExifData, ExifValue, TagCollection, TagName } from './types.js';

const ENTRIES_NUMBER_LENGTH = 2;
const ENTRY_LENGTH = 12;
const TAG_LENGTH = 2;
const DATA_FORMAT_LENGTH = 2;
const COMPONENTS_NUMBER_LENGTH = 4;
const DATA_VALUE_LENGTH = 4;

const readUnsignedRationalArray = (dataValue: Buffer, order: boolean): number[] => {
  const result: number[] = [];
  for (let i = 0; i < dataValue.length; i += 8) {
    const big = dataValue.readUInt32BE(i) / dataValue.readUInt32BE(i + 4);
    const little = dataValue.readUInt32LE(i) / dataValue.readUInt32LE(i + 4);
    result.push(order ? big : little);
  }
  return result;
};

const readUndefinedFormat = (dataValue: Buffer, tagName: TagName): ExifValue => {
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
};

const readSignedRational = (dataValue: Buffer, order: boolean): number => {
  const big = dataValue.readInt32BE(0) / dataValue.readInt32BE(4);
  const little = dataValue.readInt32LE(0) / dataValue.readInt32LE(4);
  return order ? big : little;
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
      return readUnsignedRationalArray(dataValue, order);
    }
    case 7: {
      return readUndefinedFormat(dataValue, tagName);
    }
    case 10: {
      return readSignedRational(dataValue, order);
    }
    default: {
      return `0x${dataValue.toString('hex')}`;
    }
  }
};

type IFDContext = {
  buffer: Buffer;
  tagCollection: TagCollection;
  order: boolean;
  offset: number;
};

type IFDEntry = { tagName: TagName; value: ExifValue };

const readTagNumber = (entry: Buffer, order: boolean): string => {
  const tagAddress = entry.slice(0, TAG_LENGTH);
  return order ? tagAddress.toString('hex') : Buffer.from(tagAddress.toReversed()).toString('hex');
};

const resolveDataValue = (entry: Buffer, dataLength: number, order: boolean, ctx: IFDContext): Buffer => {
  const dataValueBegin = TAG_LENGTH + DATA_FORMAT_LENGTH + COMPONENTS_NUMBER_LENGTH;
  const inline = entry.slice(dataValueBegin, dataValueBegin + DATA_VALUE_LENGTH);
  if (dataLength <= 4) return inline;

  const dataOffset = (order ? inline.readUInt32BE(0) : inline.readUInt32LE(0)) - ctx.offset;
  return ctx.buffer.slice(dataOffset, dataOffset + dataLength);
};

const parseIFDEntry = (entry: Buffer, ctx: IFDContext): IFDEntry | undefined => {
  const tagName = ctx.tagCollection[readTagNumber(entry, ctx.order)];
  if (!tagName) return undefined;

  const dataFormatBegin = TAG_LENGTH;
  const componentsBegin = dataFormatBegin + DATA_FORMAT_LENGTH;
  const dataFormat = ctx.order ? entry.readUInt16BE(dataFormatBegin) : entry.readUInt16LE(dataFormatBegin);
  const componentsNumber = ctx.order ? entry.readUInt32BE(componentsBegin) : entry.readUInt32LE(componentsBegin);
  const componentsByte = bytes[dataFormat];
  const dataLength = componentsByte === undefined ? 0 : componentsNumber * componentsByte;

  const dataValue = resolveDataValue(entry, dataLength, ctx.order, ctx);
  return { tagName, value: readTagValue(dataFormat, dataValue, ctx.order, tagName) };
};

export const IFDHandler = (buffer: Buffer, tagCollection: TagCollection, order: boolean, offset: number): ExifData => {
  const entriesNumber = order ? buffer.readUInt16BE(0) : buffer.readUInt16LE(0);
  if (entriesNumber === 0) return {};

  const entries = buffer.slice(ENTRIES_NUMBER_LENGTH);
  const ctx: IFDContext = { buffer, tagCollection, order, offset };
  const exif: ExifData = {};

  for (let i = 0; i < entriesNumber; i += 1) {
    const entry = entries.slice(i * ENTRY_LENGTH, (i + 1) * ENTRY_LENGTH);
    const parsed = parseIFDEntry(entry, ctx);
    if (parsed) exif[parsed.tagName] = parsed.value;
  }
  return exif;
};
