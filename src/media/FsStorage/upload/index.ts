import multer from "multer";
import MediaStorageEngine from "./MediaStorageEngine";
import Storage from "../../Storage";

export default function uploadHandler(storage: Storage) {
  const upload = multer({ storage: new MediaStorageEngine(storage) });
  return upload.array("file");
}
