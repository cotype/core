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
    term?: string;
    scope?: "title" | "global";
  };
};

export type ContentFormat = "html" | "plaintext" | "json" | "markdown";

export type MediaListOpts = {
  offset?: string | number;
  limit?: string | number;
  order?: string;
  orderBy?: string;
  mimetype?: string;
  search?: string;
  unUsed?: boolean;
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
 * Joins to resolve references in contents.
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
  focusX: number | null;
  focusY: number | null;
  tags: string[] | null;
  credit: string | null;
  alt: string | null;
  originalname: string | null;
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
  permissions: Permissions;
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

export type MetaData = {
  id: string;
  rev: number;
  latest: boolean;
  published: boolean;
};

export type VersionItem = Item &
  MetaData & {
    latest_rev: number;
    published_rev: boolean;
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

export type DataRecord<T = Data> = Schedule & {
  id: string;
  data: T;
  activeLanguages: string[];
};

/**
 * The REST API uses this format instead of DataRecord
 */
export type Record = {
  _id: string;
} & Data;

export type RevisionRecord = {
  rev: number;
  data: Data;
};

export type Content<T = Data> = DataRecord<T> & {
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
  type?: string;
  kind?: string;
  title: string;
  description?: string;
  image: string | undefined;
  url?: string;
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
    criteria?: Criteria,
  ): Promise<ListChunk<Item>>;
  load(
    principal: Principal,
    model: Model,
    id: string,
    join: Join,
    format?: string,
    previewOpts?: PreviewOpts,
    language?: string
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
    previewOpts?: PreviewOpts,
    language?: string
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
    data: Data,
    models: Model[],
    activeLanguages: string[]
  ): Promise<{ id: string; data: Data }>;
  delete(principal: Principal, model: Model, id: string): Promise<void>;
  update(
    principal: Principal,
    model: Model,
    id: string,
    data: Data,
    models: Model[],
    activeLanguages: string[]
  ): Promise<{ id: string; data: Data }>;
};

export type VersionedDataSource = WritableDataSource & {
  listVersions(
    principal: Principal,
    model: Model,
    id: string
  ): Promise<(VersionItem & { published: boolean })[]>;
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
    data: Data,
    models: Model[],
    activeLanguages: string[]
  ): Promise<RevisionRecord>;
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

export interface ThumbnailProvider {
  getThumbUrl(id: string, format: string): Promise<string | null>;
}

export type BaseUrls = {
  cms: string;
  media?: string;
  preview?: string;
};

type Headers = {
  [name: string]: string;
};
export interface ResponseHeaders {
  rest: {
    drafts?: Headers;
    published?: Headers;
  };
}

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

export type Language = { title: string; key: string };
