export const SOIMarkerLength = 2;
export const APPMarkerLength = 2;

const JPEGSOIMarker = 0xff_d8;
const TIFFINTEL = 0x49_49;
const TIFFMOTOROLA = 0x4d_4d;
const APPMarkerBegin = 0xff_e0;
const APPMarkerEnd = 0xff_ef;

export const bytes = [0, 1, 1, 2, 4, 8, 1, 1, 2, 4, 8, 4, 8] as const;

export const isValid = (buffer: Buffer): boolean => {
  try {
    return buffer.readUInt16BE(0) === JPEGSOIMarker;
  } catch (cause) {
    throw new Error('Unsupport file format.', { cause });
  }
};

export const isTiff = (buffer: Buffer): boolean => {
  try {
    const marker = buffer.readUInt16BE(0);
    return marker === TIFFINTEL || marker === TIFFMOTOROLA;
  } catch (cause) {
    throw new Error('Unsupport file format.', { cause });
  }
};

export const checkAPPn = (buffer: Buffer): number | false => {
  try {
    const tag = buffer.readUInt16BE(0);
    const inRange = tag >= APPMarkerBegin && tag <= APPMarkerEnd;
    return inRange ? tag - APPMarkerBegin : false;
  } catch (cause) {
    throw new Error('Invalid APP Tag.', { cause });
  }
};
