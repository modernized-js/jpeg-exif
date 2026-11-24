import { APPMarkerLength, checkAPPn } from './format.js';
import { IFDHandler } from './ifd-handler.js';
import tags from './tags.js';
import type { ExifData } from './types.js';

const BYTE_ORDER_LENGTH = 2;
const FORTY_TWO_LENGTH = 2;
const EXIF_LENGTH_LENGTH = 2;
const EXIF_IDENTIFIER_LENGTH = 5;
const EXIF_PAD_LENGTH = 1;

const trimEXIFHeader = (buffer: Buffer): Buffer => {
  const headerStripped = buffer.slice(APPMarkerLength);
  const length = headerStripped.readUInt16BE(0);
  const trimmed = headerStripped.slice(0, length);
  return trimmed.slice(EXIF_LENGTH_LENGTH + EXIF_IDENTIFIER_LENGTH + EXIF_PAD_LENGTH);
};

const isBigEndianByteOrder = (buffer: Buffer): boolean => buffer.toString('ascii', 0, BYTE_ORDER_LENGTH) === 'MM';

const readIFDOffset = (buffer: Buffer, isBigEndian: boolean): number => {
  const fortyTwoEnd = BYTE_ORDER_LENGTH + FORTY_TWO_LENGTH;
  return isBigEndian ? buffer.readUInt32BE(fortyTwoEnd) : buffer.readUInt32LE(fortyTwoEnd);
};

const attachSubExif = (result: ExifData, headerStripped: Buffer, isBigEndian: boolean): void => {
  const exifPointer = result.ExifIFDPointer;
  if (typeof exifPointer !== 'number') return;
  const sub = headerStripped.slice(exifPointer);
  result.SubExif = IFDHandler(sub, tags.ifd, isBigEndian, exifPointer);
};

const attachGPSInfo = (result: ExifData, headerStripped: Buffer, isBigEndian: boolean): void => {
  const gpsPointer = result.GPSInfoIFDPointer;
  if (typeof gpsPointer !== 'number') return;
  const gps = headerStripped.slice(gpsPointer);
  result.GPSInfo = IFDHandler(gps, tags.gps, isBigEndian, gpsPointer);
};

export const EXIFHandler = (buffer: Buffer, hasPadding = true): ExifData => {
  const headerStripped = hasPadding ? trimEXIFHeader(buffer) : buffer;
  const isBigEndian = isBigEndianByteOrder(headerStripped);
  const offsetOfIFD = readIFDOffset(headerStripped, isBigEndian);
  const ifdBuffer = headerStripped.slice(offsetOfIFD);
  if (ifdBuffer.length === 0) return {};

  const result = IFDHandler(ifdBuffer, tags.ifd, isBigEndian, offsetOfIFD);
  attachSubExif(result, headerStripped, isBigEndian);
  attachGPSInfo(result, headerStripped, isBigEndian);
  return result;
};

export const APPnHandler = (buffer: Buffer): ExifData | undefined => {
  const APPMarkerTag = checkAPPn(buffer);
  if (APPMarkerTag === false) return undefined;

  const length = buffer.readUInt16BE(APPMarkerLength);
  return APPMarkerTag === 1 ? EXIFHandler(buffer) : APPnHandler(buffer.slice(APPMarkerLength + length));
};
