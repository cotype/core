// helpers
import { Fields, ModelOpts, ObjectType, UnionTypeType } from "../typings";

export const $schema = "../models.schema.json";

function objectWithTypeAndLabel(type: string, label: string): ObjectType {
  return {
    type: "object",
    fields: {
      payload: {
        label,
        type: type as any
      }
    }
  };
}

// reusable structures
const pageFields: Fields = {
  pagetitle: { type: "string", label: "Title", required: true },
  slug: {
    type: "immutable",
    child: { type: "string", input: "slug", label: "Slug" }
  },
  title: { type: "string", label: "Überschrift", index: true },
  subTitle: { type: "string", label: "Untertitel" },
  topImage: {
    type: "media",
    label: "Titelbild",
    mediaType: "image",
    maxHeight: 10000,
    maxWidth: 10000,
    minHeight: 1000,
    minWidth: 1000,
    maxSize: 10000000000
  },
  showSiteHeader: { type: "boolean", input: "toggle" },
  showSiteFooter: { type: "boolean", input: "toggle" }
};

const teaserFields: Fields = {
  target: {
    type: "content",
    label: "Zielseite",
    models: []
  },
  headline: { type: "string", label: "Titel" },
  subHeadline: { type: "string", label: "Untertitel" },
  textPlacement: {
    type: "string",
    input: "select",
    label: "Text-Position",
    values: ["Links", "Mitte", "Rechts"]
  },
  desktopTeaser: {
    label: "Bild für Desktop",
    type: "object",
    fields: {
      image: {
        type: "media"
      }
    }
  },
  mobileTeaser: {
    label: "Bild für Smartphone",
    type: "object",
    fields: {
      image: {
        type: "media",
        label: "Vorschaubild"
      }
    }
  }
};

// reusable elements
const singleTeaser: UnionTypeType = {
  type: "object",
  label: "Vorschau",
  modalView: true,
  fields: teaserFields
};

const adventureStage: UnionTypeType = {
  label: "Erlebnisbühne",
  type: "object",
  modalView: true,
  fields: {
    teasers: {
      type: "list",
      label: "Einträge",
      sortable: true,
      item: singleTeaser
    }
  }
};

const gallery: UnionTypeType = {
  type: "object",
  label: "Gallery",
  fields: {
    images: {
      type: "list",
      sortable: true,
      label: "Bilder",
      layout: "inline",
      item: {
        type: "media"
      }
    }
  }
};

const article: UnionTypeType = {
  label: "Article",
  modalView: true,
  icon: "account",
  type: "object",
  fields: {
    parts: {
      type: "list",
      sortable: true,
      item: {
        type: "union",
        types: {
          headline: objectWithTypeAndLabel("string", "Headline"),
          crossHeadline: objectWithTypeAndLabel("string", "Sub-Headline"),
          text: objectWithTypeAndLabel("richtext", "Text"),
          gallery
        }
      }
    },
    template: {
      type: "string",
      input: "select",
      values: ["Simple Layout", "Blog Style", "Newspaper"]
    }
  }
};

export const models: ModelOpts[] = [
  {
    name: "startPage",
    singular: "Start Page",
    plural: "Start Page",
    collection: "singleton",
    urlPath: "/",
    fields: {
      title: { type: "string", maxLength: 70 },
      previewImage: {
        type: "media",
        label: "Teaser",
        mimeType: "image/jpeg"
      },
      pdf: {
        type: "media",
        label: "PDF File",
        mediaType: "pdf",
        maxSize: 9999999
      },
      textFile: {
        type: "media",
        label: "Simple TXT Datein (*.txt)",
        mimeType: "text/plain"
      },
      sections: {
        label: "Sections",
        type: "list",
        sortable: true,
        required: true,
        minLength: 1,
        maxLength: 2,
        item: {
          type: "union",
          types: {
            singleTeaser,
            adventureStage
          }
        }
      },
      refListReverse: {
        type: "references",
        model: "contentPages",
        fieldName: "refList"
      },
      refReverse: {
        type: "references",
        model: "contentPages",
        fieldName: "ref"
      }
    }
  },
  {
    name: "contentPages",
    singular: "Content Page",
    plural: "Content Pages",
    title: "pagetitle",
    uniqueFields: ["slug"],
    urlPath: "/:slug",
    notSearchAble: true,
    orderBy: "posit",
    fields: {
      posit: {
        type: "position",
        label: "Position"
      },
      date: {
        type: "string",
        input: "date",
        index: true,
        defaultValue: "tomorrow"
      },
      text: {
        type: "richtext",
        modules: {
          toolbar: [
            ["bold", "italic", "underline"],
            [{ header: [1, 2, 3, 4, 5, 6] }],
            [{ list: "ordered" }, { list: "bullet" }],
            ["clean"]
          ]
        },
        formats: [
          "bold",
          "italic",
          "link",
          "header",
          "list",
          "align",
          "underline"
        ]
      },
      ...pageFields,
      test: { type: "boolean", label: "Switch", index: true },
      number: { type: "number", label: "Number", index: true },
      stringList: {
        label: "String List",
        type: "list",
        sortable: true,
        schedule: true,
        item: {
          type: "string",
          label: "String",
          index: true
        }
      },
      refList: {
        label: "Ref List",
        type: "list",
        sortable: true,
        item: {
          type: "content",
          models: [],
          allowAbsoluteRefs: true
        }
      },
      ref: {
        type: "content",
        models: [],
        allowAbsoluteRefs: true
      },
      sections: {
        label: "Section",
        type: "list",
        sortable: true,
        item: {
          type: "union",
          types: {
            article,
            singleTeaser
          }
        }
      },
      virtual: {
        type: "virtual",
        outputType: "string",
        get: contentPage => {
          return "Not saved in CMS, this is virtual " + contentPage.pagetitle;
        }
      }
    }
  },
  {
    name: "iframe",
    collection: "iframe",
    iframeOptions: {
      url: "http://localhost:4000/docs/?session={sessionID}"
    }
  }
];
