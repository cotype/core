import * as Cotype from "../../typings";
import {
  init as initCotype,
  knexAdapter,
  Opts,
  FsStorage,
  clientMiddleware as prodClientMiddleware
} from "../../src";
import * as path from "path";
import { models } from "../models";
import { navigation } from "../navigation.json";
import devClientMiddleware from "./devClientMiddleware";
import reInitMiddleware from "./reInitMiddleware";
import { Server } from "http";
import { Express } from "express";
import ContentPersistence from "../../src/persistence/ContentPersistence";
import LocalThumbnailProvider from "@cotype/local-thumbnail-provider";

const uploadDir = path.resolve(__dirname, "..", "uploads");

function getClient(url: string) {
  if (url.match(/^postgres/)) return "pg";
  if (url.match(/^mysql/)) return "mysql";
  throw new Error("Unsupported connection string: " + url);
}

const PORT = process.env.PORT || 4000;

function getKnexConfig() {
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

export type InitState = {
  server?: Server;
};

async function init(initialConfig: Opts) {
  const state: InitState = {};
  const clientMiddleware =
    process.env.NODE_ENV === "production" ||
    process.env.CLIENT_MIDDLEWARE === "production"
      ? [prodClientMiddleware]
      : [devClientMiddleware(initialConfig.basePath)];

  const startServer = async (config: Opts) => {
    const { app } = await initCotype({ ...config, clientMiddleware });
    state.server = app.listen({ port: PORT });
  };

  if (process.env.NODE_ENV === "test") {
    clientMiddleware.unshift(
      reInitMiddleware(initialConfig, startServer, getKnexConfig, state)
    );
  }

  await startServer(initialConfig);
}

const storage = new FsStorage(uploadDir);

init({
  models: models as Cotype.ModelOpts[],
  storage,
  navigation: navigation as Cotype.NavigationOpts[],
  thumbnailProvider: new LocalThumbnailProvider(storage),
  persistenceAdapter: knexAdapter(getKnexConfig()),
  customSetup: (app: Express, persitence: ContentPersistence) => {
    app.use("/crazyCustomRoute", async (req, res) => {
      res.json({ hello: "world" });
    });
  },
  contentHooks: {
    preHooks: {
      onSave: async (model, data) => {
        return { ...data, hidden: [{ key: 0, value: "hidden value 22" }] };
      }
    },
    postHooks: {
      onCreate: async (model, data) => {
        console.info("onCreate");
      },
      onSave: async (model, data) => {
        console.info("onSave");
      },
      onDelete: async (model, data) => {
        console.info("onDelete");
      },
      onPublish: async (model, data) => {
        console.info("onPublish");
      },
      onUnpublish: async (model, data) => {
        console.info("onUnpublish");
      },
      onSchedule: async (model, data) => {
        console.info("onSchedule");
      }
    }
  }
})
  .then(() => {
    console.info(`🚀 Server ready at http://localhost:${PORT}`);
  })
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
