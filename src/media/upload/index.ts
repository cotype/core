import multer from "multer";
import MediaStorageEngine from "./MediaStorageEngine";
import Storage from "../storage/Storage";

export default function uploadHandler(storage: Storage) {
  const upload = multer({ storage: new MediaStorageEngine(storage) });
  return upload.array("file");
}
