import { ReadOnlyDataSource, ExternalDataSourceHelper } from "../../typings";
import { provide } from "../externalDataSourceHelper";

function createReadOnlySource(): ReadOnlyDataSource {
  const source: ReadOnlyDataSource = {
    contentTypes: [],
    async list() {
      return { total: 0, items: [] };
    },
    async load() {
      return null;
    },
    async loadInternal() {
      return null;
    },
    async loadItem() {
      return null;
    },
    async find() {
      return { total: 0, items: [], _refs: { content: {}, media: {} } };
    },
    async findInternal() {
      return { total: 0, items: [] };
    }
  };

  return source;
}

describe("externalDataSourceHelper", () => {
  describe("provide", () => {
    it("provides helper to externalDataSource", () => {
      const eds = jest.fn();

      provide([eds], { baseUrls: {} });

      // expect(eds).toHaveBeenCalledWith(
      //   expect.objectContaining({
      //     htmlToRichtext: expect.any(Function)
      //   })
      // );
    });

    it("returns dataSources", () => {
      const source1 = createReadOnlySource();
      const source2 = createReadOnlySource();

      const [providedSource1, providedSource2] = provide(
        [source1, () => source2],
        { baseUrls: {} }
      );

      expect(providedSource1).toEqual(source1);
      expect(providedSource2).toEqual(source2);
    });
  });
  describe("methods", () => {
    const mediaBaseUrl = "https://example.org/media/";
    // const someHtml = "<h2>Hello</h2><p>World</p>";
    let helper: ExternalDataSourceHelper;

    beforeEach(() => {
      provide(
        [
          h => {
            helper = h;
            return createReadOnlySource();
          }
        ],
        {
          baseUrls: {
            media: mediaBaseUrl
          }
        }
      );
    });

    // describe("htmlToRichtext", () => {
    //   it("converts html to richtext", () => {
    //     expect(helper.htmlToRichtext(someHtml)).toEqual({
    //       ops: [
    //         { insert: "Hello" },
    //         { attributes: { header: 2 }, insert: "\n" },
    //         { insert: "World\n" }
    //       ]
    //     });
    //   });
    // });

    // describe("richtextToHtml", () => {
    //   it("converts a quill delta to html", () => {
    //     expect(helper.richtextToHtml(helper.htmlToRichtext(someHtml))).toBe(
    //       someHtml
    //     );
    //   });
    // });

    describe("media", () => {
      describe("original", () => {
        it("converts image to absolute static", () => {
          expect(helper.media.original("foo.png")).toBe(
            "https://example.org/media/foo.png"
          );
        });
      });
      describe("fromOriginal", () => {
        it("converts absolute url to image", () => {
          expect(
            helper.media.fromOriginal("https://example.org/media/foo.png")
          ).toBe("foo.png");
        });
      });
    });

    describe("Converter", () => {
      type ApiShape = {
        foo: string;
        baz: symbol;
      };
      type HubShape = {
        bar: number;
        baz: symbol;
      };

      it("converts a dataset according to instructions", async () => {
        const converter = new helper.Converter<ApiShape, HubShape>(
          ["baz"],
          { bar: ({ foo }) => Number(foo) },
          {
            foo: ({ bar }) =>
              new Promise<string>(resolve => resolve(String(bar)))
          }
        );

        const apiDataSet: ApiShape = {
          foo: "123",
          baz: Symbol("test")
        };
        const hubDataSet: HubShape = {
          bar: 123,
          baz: apiDataSet.baz
        };

        expect(await converter.toHub(apiDataSet)).toEqual(hubDataSet);
        expect(await converter.fromHub(hubDataSet)).toEqual(apiDataSet);
      });

      it("supports spreading into instructions", async () => {
        type FooGroup = {
          foo: symbol;
        };

        type BazGroup = {
          baz: symbol;
          bam: symbol;
        };

        type FlatApiShape = {
          foo: symbol;
          bar: symbol;
          bam: symbol;
        };

        type DeepHubShape = {
          fooGroup: FooGroup;
          bazGroup: BazGroup;
        };

        const fooConverter = new helper.Converter<FlatApiShape, FooGroup>([
          "foo"
        ]);

        const bazConverter = new helper.Converter<FlatApiShape, BazGroup>(
          ["bam"],
          {
            baz: ({ bar }) => bar
          },
          {
            bar: ({ baz }) => baz
          }
        );

        const converter = new helper.Converter<FlatApiShape, DeepHubShape>(
          [],
          {
            fooGroup: fooConverter.toHub,
            bazGroup: bazConverter.toHub
          },
          {
            [helper.Converter.SPREAD]: async ({ fooGroup, bazGroup }) => ({
              ...(await fooConverter.fromHub(fooGroup)),
              ...(await bazConverter.fromHub(bazGroup))
            })
          }
        );

        const apiDataSet: FlatApiShape = {
          foo: Symbol("foo"),
          bar: Symbol("bar"),
          bam: Symbol("bam")
        };

        const hubDataSet: DeepHubShape = {
          fooGroup: { foo: apiDataSet.foo },
          bazGroup: { baz: apiDataSet.bar, bam: apiDataSet.bam }
        };

        expect(await converter.fromHub(hubDataSet)).toEqual(apiDataSet);
        expect(await converter.toHub(apiDataSet)).toEqual(hubDataSet);
      });
    });
  });
});
