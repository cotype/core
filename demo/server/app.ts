import * as Cotype from "../../typings";
import {
  init,
  knexAdapter,
  Opts,
  FsStorage,
  clientMiddleware as prodClientMiddleware
} from "../../src";
import * as path from "path";
import { models } from "../models";
import { navigation } from "../navigation.json";
import devClientMiddleware from "./devClientMiddleware";
import { Express } from "express";
import ContentPersistence from "../../src/persistence/ContentPersistence";
import LocalThumbnailProvider from "@cotype/local-thumbnail-provider";

const uploadDir = path.resolve(__dirname, "..", "uploads");
const storage = new FsStorage(uploadDir);

function getClient(url: string) {
  if (url.match(/^postgres/)) return "pg";
  if (url.match(/^mysql/)) return "mysql";
  throw new Error("Unsupported connection string: " + url);
}

export function getKnexConfig() {
  if (!process.env.DB || process.env.NODE_ENV === "test") {
    return {
      client: "sqlite3",
      connection: {
        filename: path.join(__dirname, "..", `${process.env.NODE_ENV}_db`)
      },
      useNullAsDefault: true
    };
  }
  return {
    connection: process.env.DB,
    client: getClient(process.env.DB)
  };
}

const defaultConfig: Opts = {
  models: models as Cotype.ModelOpts[],
  storage,
  navigation: navigation as Cotype.NavigationOpts[],
  thumbnailProvider: new LocalThumbnailProvider(storage),
  persistenceAdapter: knexAdapter(getKnexConfig()),
  customSetup: (a: Express, persitence: ContentPersistence) => {
    a.use("/crazyCustomRoute", async (req, res) => {
      res.json({ hello: "world" });
    });
  },
  contentHooks: {
    preHooks: {
      onSave: async (_, data) => {
        return { ...data, hidden: [{ key: 0, value: "hidden value 22" }] };
      }
    },
    postHooks: {
      onCreate: async () => {
        console.info("onCreate");
      },
      onSave: async () => {
        console.info("onSave");
      },
      onDelete: async () => {
        console.info("onDelete");
      },
      onPublish: async () => {
        console.info("onPublish");
      },
      onUnpublish: async () => {
        console.info("onUnpublish");
      },
      onSchedule: async () => {
        console.info("onSchedule");
      }
    }
  }
};

function getClientMiddleware({ clientMiddleware, basePath }: Partial<Opts>) {
  if (clientMiddleware) {
    return clientMiddleware;
  }

  return process.env.NODE_ENV === "production" ||
    process.env.CLIENT_MIDDLEWARE === "production"
    ? [prodClientMiddleware]
    : devClientMiddleware(basePath);
}

export default async function app(customConfig?: Partial<Opts>) {
  const preConfig = {
    ...defaultConfig,
    ...customConfig
  };

  const config = {
    ...preConfig,
    clientMiddleware: getClientMiddleware(preConfig)
  };

  return {
    ...(await init(config)),
    config
  };
}
