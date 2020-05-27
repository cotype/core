export type VirtualType = {
  type: "virtual";
} & (
  | {
      outputType: "string";
      get: (fullModelData: any) => string;
    }
  | {
      outputType: "number";
      get: (fullModelData: any) => number;
    }
  | {
      outputType: "boolean";
      get: (fullModelData: any) => boolean;
    }
);
export type BooleanType = {
  type: "boolean";
  input?: "checkbox" | "toggle";
  required?: boolean;
  index?: boolean;
  defaultValue?: boolean;
  hidden?: boolean;
};

export type NumberType = {
  type: "number";
  min?: number;
  max?: number;
  placeholder?: string;
  required?: boolean;
  index?: boolean;
  search?: boolean;
  hidden?: boolean;
  precision?: number;
  step?: number;
};

type LinkOpts = "mail" | "media" | "link" | "tel";

export type RichtextType = {
  type: "richtext";
  required?: boolean;
  formats?: any[][] | string[];
  linkFormats?: LinkOpts[];
  modules?: {
    [key: string]: any;
  };
  index?: boolean;
  search?: boolean;
  hidden?: boolean;
};

type Text = {
  type: "string";
  placeholder?: string;
  readOnly?: boolean;
  maxLength?: number;
  required?: boolean;
  index?: boolean;
  search?: boolean;
  hidden?: boolean;
  validationRegex?: string;
  regexError?: string;
  store?: boolean;
};
type TextArea = {
  type: "string";
  input: "textarea";
  required?: boolean;
  placeholder?: string;
  readOnly?: boolean;
  maxLength?: number;
  minRows?: number;
  maxRows?: number;
  index?: boolean;
  search?: boolean;
  hidden?: boolean;
  store?: boolean;
};

type Slug = {
  type: "string";
  input: "slug";
  required?: boolean;
  index?: boolean;
  search?: boolean;
  hidden?: boolean;
};

type DateString = {
  type: "string";
  input: "date";
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
  index?: boolean;
  search?: boolean;
  hidden?: boolean;
};

type SelectValue = { label: string; value: string | number } | string;

type Select = {
  type: "string";
  input: "select";
  nullLabel?: string;
  fetch?: string;
  values?: SelectValue[];
  required?: boolean;
  index?: boolean;
  search?: boolean;
  hidden?: boolean;
};
type PositionType = {
  type: "position";
  index?: boolean;
};

type InverseReferenceType = {
  type: "references";
  model: string;
  fieldName: string;
};

export type StringType = Text | Slug | Select | DateString | TextArea;
export type ScalarType = BooleanType | NumberType | StringType | RichtextType;

type AllMediaType = {
  mediaType?: "all";
  mimeType?: string;
};
type ImageMediaType = {
  mediaType: "image";
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
};
type VideoMediaType = {
  mediaType: "video";
};
type PDFMediaType = {
  mediaType: "pdf";
};
export type MediaType = {
  type: "media";
  required?: boolean;
  withExternal?: boolean;
  hidden?: boolean;
  maxSize?: number;
} & (AllMediaType | ImageMediaType | VideoMediaType | PDFMediaType);

export type SettingsType = {
  type: "settings";
  model: string;
  required?: boolean;
};

export type Field = Type & { label?: string };

export type Fields = {
  [key: string]: Field;
};

export type ObjectType = {
  type: "object";
  fields: Fields;
  layout?: "vertical" | "horizontal" | "inline";
  modalView?: boolean;
};

export type MapKeyValue = { label: string; value: string } | string;

export type MapType = {
  type: "map";
  keys: {
    fetch: string;
    values?: MapKeyValue[];
  };
  values: Type;
};

export type ListType = {
  type: "list";
  item: Field;
  sortable?: boolean;
  schedule?: boolean;
  addLabel?: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  layout?: "inline" | "block";
  hidden?: boolean;
};

export type UnionTypeType = ObjectType & { label?: string; icon?: string };
type UnionTypeTypes = {
  [key: string]: UnionTypeType;
};

export type UnionType = {
  type: "union";
  types: UnionTypeTypes;
  required?: boolean;
};

export type ReferenceType =
  | {
      type: "content" | "settings" | "external";
      model?: string;
      models?: string[];
      required?: boolean;
      allowAbsoluteRefs?: boolean;
      index?: boolean;
      hidden?: boolean;
    }
  | {
      type: "content";
      model?: string;
      index?: boolean;
      externalDataSource: true;
    };

export type ImmutableType = {
  type: "immutable";
  child: Field;
};

export type Type =
  | ScalarType
  | MediaType
  | SettingsType
  | ObjectType
  | MapType
  | ListType
  | UnionType
  | ReferenceType
  | PositionType
  | ImmutableType
  | InverseReferenceType
  | VirtualType;

export type ModelOpts = {
  name: string;
  singular?: string;
  plural?: string;
  collection?: "list" | "singleton" | "none" | "iframe";
  urlPath?: string;
  noFeed?: true;
  fields?: {
    [key: string]: Field & { unique?: boolean };
  };
  customQuery?: {
    [s: string]: string;
  };
  uniqueFields?: string[];
  title?: string;
  image?: string;
  group?: string;
  notSearchAble?: boolean;
  orderBy?: string;
  order?: "asc" | "desc";
  readOnly?: boolean;
  iframeOptions?: {
    url: string; // "{sessionID}" gets replaced with Session ID
  };
};

export interface GroupItemOpts {
  type: "group";
  name: string;
  path?: string;
  items: NavigationOpts[];
}

export interface GroupItem extends GroupItemOpts {
  path: string;
  items: NavigationItem[];
}

export interface ModelItemOpts {
  type: "model";
  name?: string;
  path?: string;
  model: string;
}

export interface ModelItem extends ModelItemOpts {
  path: string;
}

export type NavigationOpts = GroupItemOpts | ModelItemOpts;

export type NavigationItem = GroupItem | ModelItem;

export type ModelPaths = {
  [key: string]: string;
};

export type ModelBuilderOpts = Partial<ModelOpts> & {
  type: "content" | "settings" | "media";
  versioned?: boolean;
  required?: boolean;
  writable?: boolean;
  external?: boolean;
};

export type RequireOne<T, K extends keyof T> = T &
  {
    [P in K]-?: T[P];
  };

export type Model = ModelBuilderOpts &
  RequireOne<ModelOpts, "fields"> & {
    name: string;
    plural: string;
    singular: string;
    title: string;
  };

export type Models = {
  content: Model[];
  settings: Model[];
  media: Model;
};

export type ModelsJson = {
  $schema?: string;
  models: ModelOpts[];
};

export type NavigationJson = {
  $schema?: string;
  navigation: NavigationItem[];
};
