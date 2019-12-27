import path from "path";
import FsStorage from "../media/storage/FsStorage";

describe("FsStorage", () => {
  let storage: FsStorage;

  beforeAll(async () => {
    const uploadDir = path.join(__dirname, ".uploads");
    storage = new FsStorage(uploadDir);
  });

  it("should resolve ids", () => {
    expect(storage.getFile("aaa")).toMatch(/__tests__\/.uploads\/aaa$/);
  });

  it("should reject malformed ids", () => {
    expect(() => storage.getFile("aaa/../../bbb")).toThrowError();
    expect(() => storage.getFile("/aaa")).toThrowError();
  });
});
