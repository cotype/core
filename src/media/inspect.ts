import sizeOf from "image-size";
import hasha from "hasha";

type ImageInfo = {
  width: number | null;
  height: number | null;
  type: string | null;
  hash: string;
};

export default function inspect(file: string): Promise<ImageInfo> {
  return new Promise(async resolve => {
    const hash = (await hasha.fromFile(file, { algorithm: "md5" })) as string;

    sizeOf(file, (err, dimensions) => {
      resolve({
        ...(dimensions || { width: null, height: null, type: null }),
        hash
      });
    });
  });
}
