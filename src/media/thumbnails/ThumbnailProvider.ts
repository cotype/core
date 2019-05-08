import { ThumbnailSize } from "../../../typings";

type Formats = {
  [name: string]: ThumbnailSize;
};

export const formats: Formats = {
  square: { width: 150, height: 150, crop: true },
  preview: { width: 600, height: 600, crop: false }
};
