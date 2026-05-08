import { APPMarkerLength, checkAPPn } from './format.js';
import { IFDHandler } from './ifd-handler.js';
import tags from './tags.js';
import type { ExifData } from './types.js';

const BYTE_ORDER_LENGTH = 2;
const FORTY_TWO_LENGTH = 2;
const EXIF_LENGTH_LENGTH = 2;
const EXIF_IDENTIFIER_LENGTH = 5;
const EXIF_PAD_LENGTH = 1;

const trimEXIFHeader = (buf: Buffer): Buffer => {
  const headerStripped = buf.slice(APPMarkerLength);
  const length = headerStripped.readUInt16BE(0);
  const trimmed = headerStripped.slice(0, length);
  return trimmed.slice(EXIF_LENGTH_LENGTH + EXIF_IDENTIFIER_LENGTH + EXIF_PAD_LENGTH);
};

const readByteOrder = (buffer: Buffer): boolean => buffer.toString('ascii', 0, BYTE_ORDER_LENGTH) === 'MM';

const readIFDOffset = (buffer: Buffer, order: boolean): number => {
  const fortyTwoEnd = BYTE_ORDER_LENGTH + FORTY_TWO_LENGTH;
  return order ? buffer.readUInt32BE(fortyTwoEnd) : buffer.readUInt32LE(fortyTwoEnd);
};

const attachSubExif = (result: ExifData, headerStripped: Buffer, order: boolean): void => {
  const exifPointer = result.ExifIFDPointer;
  if (typeof exifPointer !== 'number') return;
  const sub = headerStripped.slice(exifPointer);
  result.SubExif = IFDHandler(sub, tags.ifd, order, exifPointer);
};

const attachGPSInfo = (result: ExifData, headerStripped: Buffer, order: boolean): void => {
  const gpsPointer = result.GPSInfoIFDPointer;
  if (typeof gpsPointer !== 'number') return;
  const gps = headerStripped.slice(gpsPointer);
  result.GPSInfo = IFDHandler(gps, tags.gps, order, gpsPointer);
};

export const EXIFHandler = (buf: Buffer, pad = true): ExifData => {
  const headerStripped = pad ? trimEXIFHeader(buf) : buf;
  const order = readByteOrder(headerStripped);
  const offsetOfIFD = readIFDOffset(headerStripped, order);
  const ifdBuffer = headerStripped.slice(offsetOfIFD);
  if (ifdBuffer.length === 0) return {};

  const result = IFDHandler(ifdBuffer, tags.ifd, order, offsetOfIFD);
  attachSubExif(result, headerStripped, order);
  attachGPSInfo(result, headerStripped, order);
  return result;
};

export const APPnHandler = (buffer: Buffer): ExifData | undefined => {
  const APPMarkerTag = checkAPPn(buffer);
  if (APPMarkerTag === false) return undefined;

  const length = buffer.readUInt16BE(APPMarkerLength);
  if (APPMarkerTag === 1) return EXIFHandler(buffer);
  return APPnHandler(buffer.slice(APPMarkerLength + length));
};
