import { ModelOpts } from "../../../../typings";

const models: ModelOpts[] = [
  {
    name: "news",
    singular: "News",
    uniqueFields: ["slug", "title"],
    urlPath: "path/to/:slug",
    fields: {
      title: { type: "string" },
      slug: { type: "string", input: "slug" },
      date: { type: "string" },
      image: { type: "media" },
      text: { type: "richtext" },
      ref: { type: "content", models: ["products"] }
    }
  },
  {
    name: "articleNews",
    singular: "News Article",
    uniqueFields: ["slug", "title"],
    urlPath: "path/to/:slug",
    fields: {
      title: { type: "string" },
      slug: { type: "string", input: "slug" },
      date: { type: "string" },
      image: { type: "media" },
      text: { type: "richtext" },
      ref: { type: "content", models: ["products"] }
    }
  },
  {
    name: "products",
    singular: "Product",
    urlPath: "path/to/:title",
    fields: {
      title: { type: "string", required: true },
      ean: { type: "string" },
      brand: { type: "external", models: ["brands"] },
      description: { type: "richtext" },
      image: { type: "media" }
    }
  }
];

export default models;
