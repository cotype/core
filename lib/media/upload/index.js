import multer from "multer";
import MediaStorageEngine from "./MediaStorageEngine";
export default function uploadHandler(storage) {
    const upload = multer({ storage: new MediaStorageEngine(storage) });
    return upload.array("file");
}
//# sourceMappingURL=index.js.map