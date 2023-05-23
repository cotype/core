import { IncomingMessage } from "http";
import getApp, { getKnexConfig } from "./app";
import { log } from "../../src";
import { Opts, knexAdapter } from "../../src";
import { KnexConfig } from "../../src/persistence/adapter/knex";
import { unlinkSync } from "fs";
import { Knex } from "knex";

export type ReinitOpts = {
  config?: Partial<Opts>;
  db?: "reset" | Partial<KnexConfig>;
};

function getJsonBody(req: IncomingMessage) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("readable", () => {
      body += req.read() || "";
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

function isSqlite3ConnectionConfig(
  connection: KnexConfig["connection"],
  client: KnexConfig["client"]
): connection is Knex.Sqlite3ConnectionConfig {
  return client === "sqlite3";
}

const logGreen = log.color("#22f96a");

export default async function reinit(
  req: IncomingMessage,
  appP: ReturnType<typeof getApp>
): Promise<Partial<Opts>> {
  const { config: newConfig, db } = (await getJsonBody(req)) as ReinitOpts;
  const { persistence, config: oldConfig } = await appP;
  logGreen("Re-initiating server");
  const knexConfig = getKnexConfig();

  if (db) {
    logGreen("Resetting DB");

    if (!isSqlite3ConnectionConfig(knexConfig.connection, knexConfig.client)) {
      throw new Error(
        `Testing client unexpectedly used ${knexConfig.client} for persistance`
      );
    }

    await persistence.shutdown();
    unlinkSync(knexConfig.connection.filename);
  }

  const persistenceAdapter = !db
    ? oldConfig.persistenceAdapter
    : knexAdapter({
        ...knexConfig,
        ...(db !== "reset" ? db : {})
      });

  return {
    clientMiddleware: oldConfig.clientMiddleware,
    persistenceAdapter,
    ...newConfig
  };
}
