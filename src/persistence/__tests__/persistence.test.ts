import path from "path";
import persistence from "..";
import model from "../../model";

const models = model([]);

describe("migration", () => {
  it("aaaa", async () => {
    const adapter = {
      settings: {
        find: jest.fn(),
        create: jest.fn()
      },
      content: {
        migrate: jest.fn()
      }
    } as any;

    await persistence(models, adapter, {
      migrationDir: path.join(__dirname, "migrations")
    });
    expect(adapter.content.migrate).toBeCalledWith(
      [
        expect.objectContaining({ name: "001_first" }),
        expect.objectContaining({ name: "002_second" })
      ],
      expect.any(Function)
    );
  });
});
