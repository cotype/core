import modelBuilder from "../../../../src/model/builder";
import { ModelOpts } from "../../../../typings";

const modelopts: ModelOpts = {
  name: "indexContent",
  title: "name",
  orderBy: "pos",
  uniqueFields: ["slug", "test.field5.test"],
  fields: {
    name: {
      type: "string"
    },
    pos: {
      type: "position"
    },
    slug: { type: "string", input: "slug" },
    immut: {
      type: "immutable",
      child: {
        type: "string",
        index: true
      }
    },
    test: {
      type: "object",
      fields: {
        pos2: {
          type: "position"
        },
        field1: {
          type: "number",
          index: true
        },
        field2: {
          type: "string",
          index: true
        },
        field3: {
          type: "boolean",
          index: true
        },
        field4: {
          type: "list",
          item: {
            type: "string",
            index: true
          }
        },
        field5: {
          type: "object",
          fields: {
            test: {
              type: "string"
            }
          }
        }
      }
    },
    test2: {
      type: "list",
      item: {
        type: "string",
        index: true
      }
    },
    empty: {
      type: "list",
      item: {
        type: "string",
        index: true
      }
    },
    ref: {
      type: "content",
      models: ["indexContent"],
      index: true
    },
    richText: {
      type: "richtext"
    },
    contentList: {
      type: "list",
      item: {
        type: "content",
        models: ["indexContent"],
        index: true
      }
    }
  }
};
export const model = modelBuilder({ type: "content" })([modelopts])[0];
export const data = {
  name: "Test",
  pos: "abc",
  slug: "test",
  immut: "test2",
  test: {
    pos2: "abcd",
    field1: 3,
    field2: "test3",
    field3: true,
    field4: [{ key: 0, value: "Hallo" }, { key: 1, value: "Liste" }],
    field5: {
      test: "hallo"
    }
  },
  test2: [{ key: 0, value: "Hallo2" }, { key: 1, value: "Liste2" }],
  empty: [],
  ref: {
    id: 123,
    model: "indexContent"
  },
  richText: {
    ops: [
      { insert: "asd " },
      { attributes: { link: "$intern:indexContent:321$" }, insert: "asd" },
      { insert: " ads" }
    ]
  },
  contentList: [
    {
      key: 0,
      value: {
        id: 456,
        model: "indexContent"
      }
    },
    {
      key: 1,
      value: {
        id: 789,
        model: "indexContent"
      }
    }
  ]
};
