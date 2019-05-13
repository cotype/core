import { Model } from "./models";

/**
 * Options for list views.
 */
export type ListOpts = {
  offset?: string | number;
  limit?: string | number;
  order?: string;
  orderBy?: string;
  models?: string[];
  search?: {
    prop?: string;
    term: string;
  };
};

export type MediaListOpts = {
  offset?: string | number;
  limit?: string | number;
  order?: string;
  orderBy?: string;
  mimetype?: string;
  search?: string;
};

export type PreviewOpts = {
  publishedOnly?: boolean;
  ignoreSchedule?: boolean;
};

/**
 * Criteria to search for contents.
 */
export type Criteria = {
  [field: string]: {
    eq?: any;
    ne?: any;
    lt?: any;
    gt?: any;
    gte?: any;
    lte?: any;
    like?: any;
    path?: string;
  };
};
/**
 * Joins to resolve referenes in contents.
 */
export type Join = {
  [field: string]: string[];
};

/**
 * Metadata extracted from media files.
 */
export type Meta = {
  id: string;
  size: number;
  originalname: string;
  mimetype: string | null;
  imagetype: string | null;
  width: number | null;
  height: number | null;
};

export type ImageMeta = {
  focusX?: number | null;
  focusY?: number | null;
  tags: string[] | null;
};

export type Media = Meta &
  ImageMeta & {
    created_at: string;
  };

/**
 * Settings (like Users & Roles).
 */
export type Settings = {
  id: string;
  [key: string]: any;
};

/**
 * Permissions defined by a Role.
 */
export type Permissions = {
  settings: boolean;
  preview: boolean;
  content: {
    [model: string]: number;
  };
};

/**
 * A (human) user of the system.
 */
export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: number;
  picture: string;
};

/**
 * The user performing a request.
 */
export type Principal = {
  id: string | null;
  name: string;
  permissions: Permissions;
};

/**
 * Items displayed in list views.
 */
export type Item = {
  id: string;
  type: string;
  model: string;
  title: string;
  image?: string | undefined;
  kind: string;
  childCount?: string;
  orderValue?: string;
};

export type VersionItem = Item & {
  rev: number;
  latest: boolean;
  published_rev: boolean;
  latest_rev: number;
  author_name: string;
  date: string;
};

export type Schedule = {
  visibleFrom?: null | Date;
  visibleUntil?: null | Date;
};

export type Data = {
  [field: string]: any;
};

export type DataRecord = Schedule & {
  id: string;
  data: Data;
};

/**
 * The REST API uses this format instead of DataRecord
 */
export type Record = {
  _id: string;
} & Data;

export type Content = DataRecord & {
  type: string;
  author: string;
  date: Date | string;
};

export type ContentWithRefs = Content & {
  _refs: Refs;
};

export type Refs = {
  media: MediaRefs;
  content: ContentRefs;
};

export type MediaRefs = {
  [id: string]: Meta;
};

export type ContentRefs = {
  [type: string]: {
    [id: string]: Content;
  };
};

export type SearchResultItem = {
  id: string;
  model: string;
  title: string;
  image: string | undefined;
  url: string;
};

export type Revision = DataRecord & {
  rev: number;
};

export type ListChunkWithRefs<ItemType> = {
  total: number;
  items: ItemType[];
  _refs: Refs;
};
export type ListChunk<ItemType> = {
  total: number;
  items: ItemType[];
};

export type ReadOnlyDataSource = {
  contentTypes: string[];
  list(
    principal: Principal,
    model: Model,
    opts: ListOpts,
    criteria?: Criteria
  ): Promise<ListChunk<Item>>;
  load(
    principal: Principal,
    model: Model,
    id: string,
    join: Join,
    format?: string,
    previewOpts?: PreviewOpts
  ): Promise<ContentWithRefs | null>;
  loadInternal(
    principal: Principal,
    model: Model,
    id: string,
    previewOpts?: PreviewOpts
  ): Promise<Content | null>;
  loadItem(
    principal: Principal,
    model: Model,
    id: string
  ): Promise<Item | null>;
  find(
    principal: Principal,
    model: Model,
    opts: ListOpts,
    format: string,
    join: Join,
    criteria?: Criteria,
    previewOpts?: PreviewOpts
  ): Promise<ListChunkWithRefs<Content>>;
  findInternal(
    principal: Principal,
    model: Model,
    opts: ListOpts,
    criteria?: Criteria,
    previewOpts?: PreviewOpts
  ): Promise<ListChunk<Content>>;
};

export type WritableDataSource = ReadOnlyDataSource & {
  create(
    principal: Principal,
    model: Model,
    data: object,
    models: Model[]
  ): Promise<string>;
  delete(principal: Principal, model: Model, id: string): Promise<void>;
  update(
    principal: Principal,
    model: Model,
    id: string,
    data: object,
    models: Model[]
  ): Promise<{ id: string; data: object }>;
};

export type VersionedDataSource = WritableDataSource & {
  listVersions(
    principal: Principal,
    model: Model,
    id: string
  ): Promise<Array<VersionItem & { published: boolean }>>;
  loadRevision(
    principal: Principal,
    model: Model,
    id: string,
    rev: number
  ): Promise<Revision>;
  publishRevision(
    principal: Principal,
    model: Model,
    id: string,
    rev: string | number,
    models: Model[]
  ): Promise<void>;
  createRevision(
    principal: Principal,
    model: Model,
    id: string,
    data: object,
    models: Model[]
  ): Promise<number>;
  schedule(
    principal: Principal,
    model: Model,
    id: string,
    schedule: Schedule
  ): Promise<void>;
};

export type DataSource =
  | ReadOnlyDataSource
  | WritableDataSource
  | VersionedDataSource;

export type ExternalDataSource = DataSource & {
  contentTypes: string[];
};

export type QuillDelta = {
  ops: any[];
};

export type MediaHelper = {
  original(image: string): string;
  fromOriginal(image: string): string;
};

export type CONVERTER_SPREAD_INSTRUCTION = "$$CONVERTER_SPREAD";

export type ConverterInstructions<From, To> = {
  $$CONVERTER_SPREAD?: (input: From) => Partial<To> | Promise<Partial<To>>;
} & { [key in keyof To]?: (input: From) => To[key] | Promise<To[key]> };

export interface Converter<ApiDataSet, HubDataSet> {
  fromHub(input: HubDataSet): Promise<ApiDataSet>;
  toHub(input: ApiDataSet): Promise<HubDataSet>;
}

export interface ConverterConstructor {
  SPREAD: CONVERTER_SPREAD_INSTRUCTION;
  new <ApiDataSet, HubDataSet>(
    passThrough: Array<keyof ApiDataSet>,
    toHub?: ConverterInstructions<ApiDataSet, HubDataSet>,
    fromHub?: ConverterInstructions<HubDataSet, ApiDataSet>
  ): Converter<ApiDataSet, HubDataSet>;
}

export type ExternalDataSourceHelper = {
  richtextToHtml: (delta: QuillDelta) => string;
  media: MediaHelper;
  Converter: ConverterConstructor;
};

export interface ThumbnailProvider {
  getThumbUrl(id: string, format: string): Promise<string | null>;
}

export type BaseUrls = {
  cms?: string;
  media?: string;
  preview?: string;
};

type PostHook = (model: Model, data: Data) => Promise<void>;
type PreHook = (model: Model, data: Data) => Promise<Data>;

export type PreHooks = {
  onCreate?: PreHook;
  onSave?: PreHook;
};
export type PostHooks = {
  onCreate?: PostHook;
  onSave?: PostHook;
  onDelete?: PostHook;
  onPublish?: PostHook;
  onUnpublish?: PostHook;
  onSchedule?: PostHook;
};

export type ContentHooks = {
  preHooks?: PreHooks;
  postHooks?: PostHooks;
};
