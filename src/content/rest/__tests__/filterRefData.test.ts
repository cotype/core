import removeUnnecessaryRefData, {
  createJoin,
  filterContentData,
  getContainingMedia,
  getDeepJoins
} from "../filterRefData";
import models from "./models";
import { Model, Content, Refs } from "../../../../typings";
import faker from "faker";

describe("removeUnnecessaryRefData", () => {
  const join = {
    "*ews": ["title", "slug"],
    fooBar: ["baz"],
    "*ucts": ["ean"]
  };

  const newsData = {
    data: {
      title: faker.random.words(4),
      slug: faker.lorem.slug(3),
      date: new Date().toString(),
      image: { _id: faker.system.fileName() },
      imageList: [{ key: 1, value: { _id: faker.system.fileName() } }],
      refs: {
        _id: 2,
        _ref: "content",
        _content: "products"
      }
    },
    id: "1",
    type: "news",
    author: "",
    date: "",
    activeLanguages:[]
  } as Content;

  const productData = {
    data: {
      title: faker.lorem.words(4),
      ean: faker.random.number(),
      description: faker.lorem.words(4),
      image: faker.system.fileName()
    },
    id: "2",
    type: "products",
    author: "",
    date: "",
    activeLanguages:[]
  } as Content;

  it("createJoin", async () => {
    const createdJoin = createJoin(join, models as Model[]);

    await expect(createdJoin).toStrictEqual({
      news: ["title", "slug"],
      articlenews: ["title", "slug"],
      products: ["ean"]
    });
  });

  it("filteredContentData", async () => {
    const createdJoin = createJoin(join, models as Model[]);

    const filteredContent = filterContentData(newsData, createdJoin);
    await expect(filteredContent).toMatchObject({
      title: newsData.data.title,
      slug: newsData.data.slug,
      _id: "1",
      _type: "news"
    });
  });

  it("getContainingMedia", async () => {
    const mediaRefs = {
      [newsData.data.image._id]: { someCrazyProps: "forBar" },
      [newsData.data.imageList[0]._id]: { someCrazyProps: "forBar2" },
      [faker.random.image()]: { someCrazyProps: "forBar3" },
      [faker.random.image()]: { someCrazyProps: "forBar4" }
    } as any;

    const containingMedia = getContainingMedia(
      newsData,
      models[0] as Model,
      mediaRefs
    );

    await expect(containingMedia).toStrictEqual({
      [newsData.data.image._id]: { someCrazyProps: "forBar" },
      [newsData.data.imageList[0]._id]: { someCrazyProps: "forBar2" }
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
        [newsData.data.image._id]: { ...meta, id: newsData.data.image._id },
        [faker.system.fileName()]: { ...meta, id: "image2.exe" }
      }
    };
    const cleanRefs = removeUnnecessaryRefData(
      [newsData, productData],
      refs,
      join,
      models as Model[]
    );

    await expect(cleanRefs).toStrictEqual({
      content: {
        news: {
          "1": {
            _id: "1",
            _type: "news",
            slug: newsData.data.slug,
            title: newsData.data.title
          }
        },
        products: {
          "2": { ean: productData.data.ean, _id: "2", _type: "products" }
        }
      },
      media: {
        [newsData.data.image._id]: { ...meta, id: newsData.data.image._id }
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

    await expect(deepJoins).toStrictEqual([
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

    await expect(deepJoins).toStrictEqual([
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

    await expect(deepJoins).toStrictEqual([
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
