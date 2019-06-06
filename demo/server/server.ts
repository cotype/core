import { createServer } from "http";
import getApp from "./app";
import { log } from "../../src";
import reinit from "./reinit";

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;

let appP = getApp();

createServer(async (req, res) => {
  try {
    if (
      process.env.NODE_ENV === "test" &&
      req.method === "POST" &&
      req.url === "/admin/__reinit"
    ) {
      appP = reinit(req, appP).then(getApp);
      res.statusCode = 204;
      res.end();
    } else {
      (await appP).app(req, res);
    }
  } catch (err) {
    log.error(err);
    process.exit(1);
  }
}).listen(port, () => log.info(`Server ready at http://localhost:${port}`));
