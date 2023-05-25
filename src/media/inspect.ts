import probe from "probe-image-size";
import fileType from "file-type";
import { Readable } from "stream";
import hasha from "hasha";

type FileImageInfo = {
  width: number | null;
  height: number | null;
  ext: string | null;
  mime: string | null;
  hash: string;
};

const inspect = async (
  fileStream: NodeJS.ReadableStream,
  filePath: string
): Promise<FileImageInfo> => {
  const readableStream = new Readable();
  readableStream.wrap(fileStream);

  const [pipedFileStream, hash] = await Promise.all([
    fileType.stream(readableStream),
    hasha.fromFile(filePath, {
      algorithm: "md5"
    })
  ]);

  let fileImageInfo: FileImageInfo = {
    hash: String(hash),
    width: null,
    height: null,
    ext: null,
    mime: null
  };
  if (!pipedFileStream || !pipedFileStream.fileType) {
    return fileImageInfo;
  }

  fileImageInfo = {
    ...fileImageInfo,
    ...pipedFileStream
  };
  if (fileImageInfo.mime!.startsWith("image")) {
    const imageInfo = await probe(pipedFileStream);
    if (imageInfo.width && imageInfo.height) {
      fileImageInfo.width = imageInfo.width;
      fileImageInfo.height = imageInfo.height;
    }
  }
  return fileImageInfo;
};
export default inspect;
