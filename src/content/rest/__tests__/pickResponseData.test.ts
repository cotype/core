import {
  Content,
  ContentWithRefs,
  ListChunkWithRefs,
  Meta,
  ModelOpts,
  Model
} from "../../../../typings";
import pickFieldsFromResultData from "../pickFieldsFromResultData";

const contentRef = {
  _content: "document",
  _id: 853,
  _ref: "content"
};

const mediaRef = {
  id: "abc.pdf",
  size: 12345
} as Meta;

const model: ModelOpts = {
  name: "TestModel",
  singular: "Foo",
  plural: "Foos",
  fields: {
    foo: { type: "string" },
    bar: {
      type: "object",
      fields: {
        bar: { type: "number" }
      }
    },
    fooBar: {
      type: "media"
    },
    bazn: {
      type: "content",
      models: [contentRef._content]
    }
  }
};

const data: Content = {
  id: "1",
  data: {
    _id: "1",
    foo: "some fooish text",
    bar: {
      baz: 12
    },
    fooBar: {
      _id: mediaRef.id,
      _ref: "media",
      _src: "https://barbar.baz/abc.pdf"
    },
    bazn: contentRef
  },
  type: "foo",
  author: "bar",
  date: "baz"
};

const _mediaRefs = {
  [mediaRef.id]: mediaRef
};

const _contentRefs = {
  [contentRef._content]: {
    [contentRef._id]: {
      someProps: "props"
    } as any
  }
};

const _refs = {
  media: _mediaRefs,
  content: _contentRefs
};
const singleContent: ContentWithRefs = {
  ...data,
  _refs
};

const listOfContent: ListChunkWithRefs<Content> = {
  total: 1,
  items: [data],
  _refs
};
describe("pickFieldsFromResultData", () => {
  describe("pick single content", () => {
    it("should return full response", async () => {
      await expect(
        pickFieldsFromResultData(singleContent, [], model as Model)
      ).toEqual(expect.objectContaining(singleContent));
    });

    it("should return only selected fields", async () => {
      const { fooBar, bazn, ...restData } = data.data;
      await expect(
        pickFieldsFromResultData(
          singleContent,
          ["foo", "bar", "bazn"],
          model as Model
        )
      ).toEqual(
        expect.objectContaining({
          ...singleContent,
          data: { ...restData, bazn },
          _refs: {
            media: {},
            content: _contentRefs
          }
        })
      );
      await expect(
        pickFieldsFromResultData(singleContent, ["foo", "bar"], model as Model)
      ).toEqual(
        expect.objectContaining({
          ...singleContent,
          data: { ...restData },
          _refs: {
            media: {},
            content: {}
          }
        })
      );
    });
  });

  describe("pick list of content", () => {
    it("should return full response", async () => {
      await expect(
        pickFieldsFromResultData(listOfContent, [], model as Model)
      ).toEqual(expect.objectContaining(listOfContent));
    });

    it("should return only selected fields", async () => {
      const { fooBar, bazn, ...restData } = data.data;

      await expect(
        pickFieldsFromResultData(
          listOfContent,
          ["foo", "bar", "bazn"],
          model as Model
        )
      ).toEqual(
        expect.objectContaining({
          total: 1,
          items: [{ ...data, data: { ...restData, bazn } }],
          _refs: {
            media: {},
            content: _contentRefs
          }
        })
      );
      await expect(
        pickFieldsFromResultData(listOfContent, ["foo", "bar"], model as Model)
      ).toEqual(
        expect.objectContaining({
          total: 1,
          items: [{ ...data, data: { ...restData } }],
          _refs: {
            media: {},
            content: {}
          }
        })
      );
    });
  });
});
