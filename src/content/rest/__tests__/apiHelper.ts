import { stringify } from "qs";
import request from "supertest";

export function createApiReadHelpers(server: request.SuperTest<request.Test>) {
  const list = async (
    type: string,
    params: object = {},
    published: boolean = true
  ) => {
    const { body } = await server
      .get(
        `/rest/${published ? "published" : "drafts"}/${type}?${stringify(
          params
        )}`
      )
      .expect(200);

    return body;
  };
  const find = async (
    type: string,
    id: string,
    params: object = {},
    published: boolean = true
  ) => {
    const { body } = await server
      .get(
        `/rest/${published ? "published" : "drafts"}/${type}/${id}?${stringify(
          params
        )}`
      )
      .expect(200);

    return body;
  };

  const search = async (
    term: string,
    opts: {
      published?: boolean;
      linkableOnly?: boolean;
      includeModels?: string[];
      excludeModels?: string[];
      limit?: number;
      offset?: number;
    }
  ) => {
    const {
      published = true,
      linkableOnly = true,
      includeModels = [],
      excludeModels = [],
      limit = 50,
      offset = 0
    } = opts;
    const { body } = await server
      .get(
        `/rest/${published ? "published" : "drafts"}/search/content?${stringify(
          {
            term,
            limit,
            offset,
            linkableOnly,
            includeModels,
            excludeModels
          }
        )}`
      )
      .expect(200);

    return body;
  };

  const suggest = async (
    term: string,
    opts: {
      published?: boolean;
      linkableOnly?: boolean;
      includeModels?: string[];
      excludeModels?: string[];
    }
  ) => {
    const {
      published = true,
      linkableOnly = true,
      includeModels = [],
      excludeModels = []
    } = opts;
    const { body } = await server
      .get(
        `/rest/${published ? "published" : "drafts"}/search/suggest?${stringify(
          {
            term,
            linkableOnly,
            includeModels,
            excludeModels
          }
        )}`
      )
      .expect(200);

    return body;
  };

  const findByField = async (
    type: string,
    field: string,
    value: string,
    params: object = {},
    published: boolean = true
  ) => {
    const { body } = await server
      .get(
        `/rest/${
          published ? "published" : "drafts"
        }/${type}/${field}/${value}?${stringify(params)}`
      )
      .expect(200);

    return body;
  };

  return { find, list, search, findByField, suggest };
}
export function createApiWriteHelpers(
  server: request.SuperTest<request.Test>,
  headers: object
) {
  const create = async (type: string, data: object) => {
    const { body } = await server
      .post(`/admin/rest/content/${type}`)
      .set(headers)
      .send({ data })
      .expect(200);

    return body;
  };

  const update = async (type: string, id: string, data: object) => {
    const { body } = await server
      .put(`/admin/rest/content/${type}/${id}`)
      .set(headers)
      .send(data)
      .expect(200);

    return body;
  };

  const schedule = async (
    type: string,
    id: string,
    data: {
      visibleFrom?: Date | string | null;
      visibleUntil?: Date | string | null;
    }
  ) => {
    const { body } = await server
      .post(`/admin/rest/content/${type}/${id}/schedule`)
      .set(headers)
      .send(data)
      .expect(204);

    return body;
  };

  const publish = async (type: string, id: string) =>
    server
      .post(`/admin/rest/content/${type}/${id}/publish`)
      .set(headers)
      .send({ rev: 1 })
      .expect(204);

  return { create, update, schedule, publish };
}
