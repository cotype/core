import fs from "fs";
import path from "path";
import { ModelOpts, NavigationOpts } from "../../typings";

export default function navigstionBuilder(dir1: string) {
  const models: ModelOpts[] = [];
  const navigation: NavigationOpts[] = [];
  const extensions = Object.keys(require.extensions);
  function read(dir2: string, group: NavigationOpts[]) {
    fs.readdirSync(dir2)
      .sort()
      .map(f => path.join(dir2, f))
      .forEach(f => {
        const name = path
          .basename(f)
          .replace(/_/g, " ")
          .replace(/^\d+\s*/, "");

        if (fs.statSync(f).isDirectory()) {
          const items: NavigationOpts[] = [];
          group.push({
            type: "group",
            name,
            items
          });
          read(f, items);
        } else {
          const ext = path.extname(f);
          if (extensions.includes(ext)) {
            const mod = require(f);
            const model = (mod.default || mod) as ModelOpts;
            models.push(model);
            group.push({
              type: "model",
              name: path.basename(name, ext),
              model: model.name
            });
          }
        }
      });
  }

  read(dir1, navigation);
  return { navigation, models };
}
