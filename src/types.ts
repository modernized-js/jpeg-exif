import type { IfdTagName, GpsTagName } from './tags.js';

export type TagName = IfdTagName | GpsTagName;
export type ExifValue = string | number | number[];
export type ExifData = {
  [tag in TagName]?: ExifValue;
} & {
  SubExif?: ExifData;
  GPSInfo?: ExifData;
};
export type ParseCallback = (err: Error | undefined, data?: ExifData) => void;
export type TagCollection = Readonly<Record<string, TagName>>;
