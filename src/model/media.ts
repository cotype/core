import * as Cotype from "../../typings";
/**
 * Model definition of the built-in media entities.
 */
const models: Cotype.ModelOpts[] = [
  {
    name: "media",
    singular: "Media",
    fields: {
      size: { type: "number" },
      originalname: { type: "string" },
      mimetype: { type: "string" },
      imagetype: { type: "string" },
      width: { type: "number" },
      height: { type: "number" },
      created_at: { type: "string" },
      title: { type: "string" },
      alt: { type: "string" },
      credit: { type: "string" },
      focusX: { type: "number" },
      focusY: { type: "number" }
    }
  }
];

export default models;
