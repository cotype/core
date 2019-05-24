import { Request, Response, NextFunction } from "express";

import { unlinkSync } from "fs";
import { Sqlite3ConnectionConfig } from "knex";
import { Opts, knexAdapter } from "../../src";
import { KnexConfig } from "../../src/persistence/adapter/knex";
import { InitState } from "./server";

export type ReinitOpts = {
  config?: Partial<Opts>;
  db?: "reset" | Partial<KnexConfig>;
};

function isSqlite3ConnectionConfig(
  connection: KnexConfig["connection"],
  client: KnexConfig["client"]
): connection is Sqlite3ConnectionConfig {
  return client === "sqlite3";
}

export default function reInitMiddleware(
  initialConfig: Opts,
  startServer: (config: Opts) => Promise<void>,
  getKnexConfig: () => KnexConfig,
  state: InitState
) {
  let config = initialConfig;
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method === "POST" && req.url === "/__reinit") {
      try {
        const { config: newConfig, db } = req.body as ReinitOpts;

        console.info("♻️  Re-initiating server...");
        state.server!.close();
        const knexConfig = getKnexConfig();

        if (db) {
          console.info("🌱 Resetting DB");

          if (
            !isSqlite3ConnectionConfig(knexConfig.connection, knexConfig.client)
          ) {
            throw new Error(
              `Testing client unexpectedly used ${
                knexConfig.client
              } for persistance`
            );
          }

          (await config.persistenceAdapter).shutdown();
          await unlinkSync(knexConfig.connection.filename);
        }

        config = {
          ...initialConfig,
          persistenceAdapter: !db
            ? config.persistenceAdapter
            : knexAdapter({
                ...knexConfig,
                ...(db !== "reset" ? db : {})
              }),
          ...newConfig
        };

        await startServer(config);
        console.info("👍 Server Re-Initiated");
      } catch (error) {
        console.error(error);
        process.exit(1);
      }
      res.sendStatus(204);
      return;
    }
    return next();
  };
}
