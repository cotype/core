/* tslint:disable:max-classes-per-file */

import * as Cotype from "../../typings";
import basePath from "./basePath";
import { Omit } from "../typings/helper";
import { stringify } from "qs";

type Opts = RequestInit & { query?: object };

class ApiError extends Error {
  status: number;
  body: any;
  constructor(res: Response, body: any) {
    super(res.statusText);
    this.status = res.status;
    this.body = body;
  }
}

function encodeMediaId(s: string) {
  // NOTE: We add a trailing slash to the URL as some caching proxies otherwise
  // think we are requesting a static image resouce and drop the Cookie header.
  return encodeURIComponent(s) + "/";
}

class Api {
  baseURI: string;

  constructor(baseURI: string) {
    this.baseURI = baseURI;
  }

  getBody(res: Response) {
    if (res.status === 204) {
      return Promise.resolve();
    }
    const contentType = res.headers.get("content-type");
    if (contentType && /application\/json/.test(contentType)) return res.json();
    return Promise.resolve();
  }

  fetch(path: string, opts: Opts): Promise<any> {
    const { query, ...fetchOpts } = opts;
    const qs = query
      ? stringify(query, {
          addQueryPrefix: true,
          encodeValuesOnly: true
        })
      : "";
    return fetch(`${this.baseURI}${path}${qs}`, {
      credentials: "include",
      ...fetchOpts
    }).then(res =>
      this.getBody(res).then(body => {
        if (res.ok) return body;
        if (res.status === 403) {
          if (path !== "/info") window.location.reload();
        }
        throw new ApiError(res, body);
      })
    );
  }

  get(path: string, query?: object) {
    return this.fetch(path, { query });
  }

  del(path: string, opts?: Opts) {
    return this.fetch(path, { method: "delete", ...opts });
  }

  submit(
    method: string,
    path: string,
    body: object | null = null,
    opts?: Opts
  ) {
    return this.fetch(path, {
      method,
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(body),
      ...opts
    });
  }

  post(path: string, body?: object, opts?: Opts) {
    return this.submit("post", path, body, opts);
  }

  put(path: string, body?: object, opts?: Opts) {
    return this.submit("put", path, body, opts);
  }

  list(
    model: Cotype.Model,
    listOpts: { q?: string } & Omit<Cotype.ListOpts, "search">,
    criteria: Cotype.Criteria = {}
  ): Promise<Cotype.ListChunk<Cotype.Item>> {
    const { type, name } = model;
    return this.get(`/${type}/${name}`, { ...listOpts, ...criteria });
  }

  load(model: Cotype.Model, id: string): Promise<Cotype.DataRecord> {
    const { type, name } = model;
    return this.get(`/${type}/${name}/${id}`);
  }

  // TODO rename to loadRevison
  loadVersion(
    model: Cotype.Model,
    id: string,
    rev: string | number
  ): Promise<Cotype.Revision> {
    const { type, name } = model;
    return this.get(`/${type}/${name}/${id}/versions/${rev}`);
  }

  getVersions(
    model: Cotype.Model,
    id: string
  ): Promise<Array<Cotype.VersionItem & { published: boolean }>> {
    const { type, name } = model;
    return this.get(`/${type}/${name}/${id}/versions`);
  }

  save(
    model: Cotype.Model,
    id: string | undefined,
    data: Cotype.Data
  ): Promise<Cotype.DataRecord> {
    const { type, name } = model;
    if (id) {
      return this.put(`/${type}/${name}/${id}`, data);
    }
    const body: any = { data };
    return this.post(`/${type}/${name}`, body);
  }

  delete(model: Cotype.Model, id: string): Promise<void> {
    const { type, name } = model;
    return this.del(`/${type}/${name}/${id}`);
  }

  publish(model: Cotype.Model, id: string, rev: number | null) {
    return this.post(`/${model.type}/${model.name}/${id}/publish`, {
      rev
    });
  }

  unpublish(model: Cotype.Model, id: string) {
    return this.publish(model, id, null);
  }

  schedule(model: Cotype.Model, id: string, schedule: Cotype.Schedule) {
    return this.post(`/${model.type}/${model.name}/${id}/schedule`, schedule);
  }

  listMedia(
    listOpts: Cotype.MediaListOpts
  ): Promise<Cotype.ListChunk<Cotype.Media>> {
    return this.get(`/media`, listOpts);
  }

  loadMedia(id: string): Promise<Cotype.Media> {
    return this.get(`/media/${encodeMediaId(id)}`);
  }

  updateMedia(id: string, meta: Cotype.ImageMeta): Promise<void> {
    return this.post(`/media/${encodeMediaId(id)}`, meta);
  }

  deleteMedia(id: string): Promise<void> {
    return this.del(`/media/${encodeMediaId(id)}`);
  }
}

const api = new Api(`${basePath}/rest`);

export default api;
