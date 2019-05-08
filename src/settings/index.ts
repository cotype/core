import { Models } from "../../typings";
import { Router } from "express";
import routes from "./routes";
import describe from "./describe";
import login from "../auth/login";
import { Persistence } from "../persistence";

export default (persistence: Persistence, models: Models) => {
  return {
    describe(api: any) {
      models.settings.forEach(m => describe(api, m));
    },
    routes(router: Router) {
      router.use("/admin/rest/settings", login);
      models.settings.forEach(m => routes(router, persistence, m));
    }
  };
};
