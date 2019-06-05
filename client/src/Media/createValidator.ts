import { matchMime } from "../utils/helper";

export type MediaFilter = {
  mimeType?: string;
  maxSize?: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
};

type GetElementType<T extends any[]> = T extends Array<infer U> ? U : never;

function every<T extends any[]>(
  thing: T,
  cb: (value: GetElementType<T>, index: number, array: T[]) => boolean
) {
  return Array.prototype.every.call(thing, cb);
}

function map<T extends any[], U>(
  thing: T,
  cb: (value: any, index: number, array: any[]) => U
) {
  return Array.prototype.map.call(thing, cb);
}

export default function createValidator(
  mediaType?: string,
  mediaFilter?: MediaFilter
) {
  return async (files: File[]): Promise<boolean> => {
    let allowed = true;
    if (mediaType && mediaType !== "all") {
      allowed = allowed && every(files, file => file.type.includes(mediaType));
    }
    if (mediaFilter) {
      if (mediaFilter.mimeType) {
        allowed =
          allowed &&
          every(files, file => matchMime(file.type, mediaFilter.mimeType));
      }
      if (mediaFilter.maxSize) {
        allowed =
          allowed &&
          every(
            files,
            file => mediaFilter && file.size < (mediaFilter as any).maxSize
          );
      }
      if (
        mediaFilter.minHeight ||
        mediaFilter.minWidth ||
        mediaFilter.maxWidth ||
        mediaFilter.maxHeight
      ) {
        const checkedImageSizes = await Promise.all(
          map(
            files,
            file =>
              new Promise(resolve => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = (e: any) => {
                  const image = new Image();
                  image.src = e.target.result;
                  image.onload = () => {
                    const height = image.naturalHeight;
                    const width = image.naturalWidth;
                    resolve(
                      !(
                        (mediaFilter.maxWidth &&
                          mediaFilter.maxWidth < width) ||
                        (mediaFilter.minWidth &&
                          mediaFilter.minWidth > width) ||
                        (mediaFilter.maxHeight &&
                          mediaFilter.maxHeight < height) ||
                        (mediaFilter.minHeight &&
                          mediaFilter.minHeight > height)
                      )
                    );
                  };
                };
              })
          )
        );
        allowed = checkedImageSizes.reduce(
          (acc, a) => acc && a,
          allowed
        ) as boolean;
      }
    }

    return allowed;
  };
}
