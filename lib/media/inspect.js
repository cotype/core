import probe from "probe-image-size";
import fileType from "file-type";
import { Readable } from "stream";
import hasha from "hasha";
const inspect = async (fileStream, filePath) => {
    const readableStream = new Readable();
    readableStream.wrap(fileStream);
    const [pipedFileStream, hash] = await Promise.all([
        fileType.stream(readableStream),
        hasha.fromFile(filePath, {
            algorithm: "md5"
        })
    ]);
    let fileImageInfo = {
        hash: String(hash),
        width: null,
        height: null,
        ext: null,
        mime: null
    };
    if (!pipedFileStream || !pipedFileStream.fileType) {
        return fileImageInfo;
    }
    fileImageInfo = Object.assign(Object.assign({}, fileImageInfo), pipedFileStream);
    if (fileImageInfo.mime.startsWith("image")) {
        const imageInfo = await probe(pipedFileStream);
        if (imageInfo.width && imageInfo.height) {
            fileImageInfo.width = imageInfo.width;
            fileImageInfo.height = imageInfo.height;
        }
    }
    return fileImageInfo;
};
export default inspect;
//# sourceMappingURL=inspect.js.map