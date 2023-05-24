/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
type FileImageInfo = {
    width: number | null;
    height: number | null;
    ext: string | null;
    mime: string | null;
    hash: string;
};
declare const inspect: (fileStream: NodeJS.ReadableStream, filePath: string) => Promise<FileImageInfo>;
export default inspect;
