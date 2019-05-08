import getRefUrl from "../getRefUrl";

describe("getRefUrl", () => {
  it("It should return url with slug", () => {
    const data = {
      a: "foo",
      b: { a: "nestedslug" },
      slugz: "foobarbaz"
    };

    const url1 = getRefUrl(data, "/foo/bar/baz/:slugz");
    expect(url1).toBe("/foo/bar/baz/foobarbaz");

    const url2 = getRefUrl(data, "/foo/bar/baz/:b.a");
    expect(url2).toBe("/foo/bar/baz/nestedslug");

    const url3 = getRefUrl(data, "/:a");
    expect(url3).toBe("/foo");

    const url4 = getRefUrl(data, "/foo/bar/baz/:slugz/:a");
    expect(url4).toBe("/foo/bar/baz/foobarbaz/foo");

    const url5 = getRefUrl(data, "/foo/bar/baz/:slugz/:a/test/:b.a");
    expect(url5).toBe("/foo/bar/baz/foobarbaz/foo/test/nestedslug");
  });
});
