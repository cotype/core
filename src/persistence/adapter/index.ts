import * as Cotype from "../../../typings";

export type SettingsAdapter = {
  create(model: Cotype.Model, data: object): Promise<string>;
  load(model: Cotype.Model, id: string): Promise<Cotype.Settings>;
  find(
    model: Cotype.Model,
    field: string,
    value: any
  ): Promise<Cotype.Settings>;
  list(
    model: Cotype.Model,
    opts: Cotype.ListOpts
  ): Promise<Cotype.ListChunk<Cotype.Settings>>;
  update(model: Cotype.Model, id: string, data: object): Promise<void>;
  delete(model: Cotype.Model, id: string): Promise<any>;
  deleteUser(id: string): Promise<any>;
  findUserByEmail(id: string): Promise<Cotype.Settings>;
  loadUser(id: string): Promise<Cotype.User>;
};

export type ContentAdapter = {
  create(
    model: Cotype.Model,
    data: object,
    author: string,
    models: Cotype.Model[]
  ): Promise<string>;
  createRevision(
    model: Cotype.Model,
    id: string,
    author: string,
    data: object,
    models: Cotype.Model[]
  ): Promise<number>;
  findByMedia(media: string): Promise<any[]>;
  list(
    model: Cotype.Model,
    models: Cotype.Model[],
    listOpts: Cotype.ListOpts,
    criteria?: Cotype.Criteria
  ): Promise<Cotype.ListChunk<Cotype.Content>>;
  load(
    model: Cotype.Model,
    id: string,
    previewOpts?: Cotype.PreviewOpts
  ): Promise<Cotype.Content | null>;
  loadContentReferences(
    ids: string[],
    published?: boolean,
    join?: Cotype.Join[]
  ): Promise<Cotype.Data[]>;
  loadMediaFromContents(
    ids: string[],
    published?: boolean
  ): Promise<Cotype.Meta[]>;
  loadRevision(
    model: Cotype.Model,
    id: string,
    rev: number
  ): Promise<Cotype.Revision>;
  listVersions(
    model: Cotype.Model,
    id: string
  ): Promise<Array<Cotype.VersionItem & { published: boolean }>>;
  setPublishedRev(
    model: Cotype.Model,
    id: string,
    published: number | null,
    models: Cotype.Model[]
  ): Promise<any>;
  schedule(
    model: Cotype.Model,
    id: string,
    schedule: Cotype.Schedule
  ): Promise<void>;
  delete(model: Cotype.Model, id: string): Promise<any>;
  search(
    term: string,
    opts: Cotype.ListOpts,
    previewOpts?: Cotype.PreviewOpts
  ): Promise<Cotype.ListChunk<Cotype.Content>>;

  // For the read-only API:
  find(
    model: Cotype.Model,
    opts: Cotype.ListOpts,
    models: Cotype.Model[],
    criteria?: Cotype.Criteria,
    previewOpts?: Cotype.PreviewOpts
  ): Promise<Cotype.ListChunk<Cotype.Content>>;
};

export type MediaAdapter = {
  create(meta: Cotype.Meta): Promise<void>;
  list(opts: Cotype.MediaListOpts): Promise<Cotype.ListChunk<Cotype.Media>>;
  load(id: string[]): Promise<Cotype.Media[]>;
  findByHash(hash: string[]): Promise<Cotype.Media[]>;
  update(id: string, data: Cotype.Media): Promise<Cotype.Media>;
  delete(id: string, models: Cotype.Model[]): Promise<any>;
};

export type PersistenceAdapter = {
  settings: SettingsAdapter;
  content: ContentAdapter;
  media: MediaAdapter;
  reset?: (...params: any[]) => Promise<void>;
  shutdown: () => void | Promise<any>;
};
