import orderSearchResults from "../orderSearchResults";
import { SearchResultItem } from "../../../../typings";

const items = [
  { title: "hello hola" },
  { title: "hello world" },
  { title: "crazy crazy world" },
  { title: "what a world" }
] as SearchResultItem[];

describe("order search results", () => {
  it("should order results according to first match in title string", async () => {
    expect(orderSearchResults(items, "world")).toStrictEqual([
      { title: "hello world" },
      { title: "what a world" },
      { title: "crazy crazy world" },
      { title: "hello hola" }
    ]);
  });
});
