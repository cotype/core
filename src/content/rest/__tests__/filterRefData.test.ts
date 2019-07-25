import removeUnnecessaryRefData, {
  createJoin,
  filterContentData,
  getContainingMedia,
  getDeepJoins
} from "../filterRefData";
import models from "./models";
import { Model, Content, Refs } from "../../../../typings";

describe("removeUnnecessaryRefData", () => {
  const join = {
    "*ews": ["title", "slug"],
    fooBar: ["baz"],
    "*ucts": ["ean"]
  };

  const newsData = {
    data: {
      title: "Hello World",
      slug: "Slug That",
      date: "Some Date",
      image: { _id: "image.exe" },
      refs: {
        _id: 2,
        _ref: "content",
        _content: "products"
      }
    },
    id: "1",
    type: "news",
    author: "",
    date: ""
  } as Content;

  const productData = {
    data: {
      title: "title",
      ean: "ean",
      description: "description",
      image: "image"
    },
    id: "2",
    type: "products",
    author: "",
    date: ""
  } as Content;

  it("createJoin", async () => {
    const createdJoin = createJoin(join, models as Model[]);

    await expect(createdJoin).toEqual({
      news: ["title", "slug"],
      articlenews: ["title", "slug"],
      products: ["ean"]
    });
  });

  it("filteredContentData", async () => {
    const createdJoin = createJoin(join, models as Model[]);

    const filteredContent = filterContentData(newsData, createdJoin);
    await expect(filteredContent).toMatchObject({
      title: "Hello World",
      slug: "Slug That",
      _id: "1",
      _type: "news"
    });
  });

  it("getContainingMedia", async () => {
    const mediaRefs = {
      "image.exe": { someCrazyProps: "forBar" },
      "image2.exe": { someCrazyProps: "forBar2" }
    } as any;

    const containingMedia = getContainingMedia(
      newsData,
      models[0] as Model,
      mediaRefs
    );

    await expect(containingMedia).toEqual({
      "image.exe": { someCrazyProps: "forBar" }
    });
  });

  it("removeUnnecessaryRefData", async () => {
    const meta = {
      size: 6548,
      originalname: "header-transparent.svg",
      mimetype: "image/svg+xml",
      imagetype: "svg",
      width: 124,
      height: 124,
      focusX: null,
      focusY: null,
      tags: null,
      search: " header-transparent.svg",
      created_at: "2019-02-14 16:45:01",
      hash: "e7b33f19085432c54fc57ef2a6fb1784"
    };
    const refs: Refs = {
      content: {
        news: {
          1: newsData
        },
        products: {
          2: productData
        }
      },
      media: {
        "image.exe": { ...meta, id: "image.exe" },
        "image2.exe": { ...meta, id: "image2.exe" }
      }
    };
    const cleanRefs = removeUnnecessaryRefData(
      [newsData, productData],
      refs,
      join,
      models as Model[]
    );

    await expect(cleanRefs).toEqual({
      content: {
        news: {
          "1": {
            _id: "1",
            _type: "news",
            slug: "Slug That",
            title: "Hello World"
          }
        },
        products: { "2": { ean: "ean", _id: "2", _type: "products" } }
      },
      media: {
        "image.exe": { ...meta, id: "image.exe" }
      }
    });
  });
});

describe("convertDeepJons", () => {
  it("get Join Levels", async () => {
    const deepJoins = getDeepJoins(
      {
        news: ["title", "ref.ean"]
      },
      models as Model[]
    );

    await expect(deepJoins).toEqual([
      {
        news: ["title", "ref"]
      },
      {
        products: ["ean"]
      }
    ]);
  });
  it("get Join Levels with List", async () => {
    const deepJoins = getDeepJoins(
      {
        products: ["title", "sections.title"]
      },
      models as Model[]
    );

    await expect(deepJoins).toEqual([
      {
        products: ["title", "sections"]
      },
      {
        section: ["title"]
      }
    ]);
  });
  it("get Join Levels with List 2-Levels", async () => {
    const deepJoins = getDeepJoins(
      {
        news: ["title", "ref.title", "ref.sections.title"]
      },
      models as Model[]
    );

    await expect(deepJoins).toEqual([
      {
        news: ["title", "ref"]
      },
      {
        products: ["title", "sections"]
      },
      {
        section: ["title"]
      }
    ]);
  });
});
