import fs from "fs";
import path from "path";
export default function navigstionBuilder(dir1) {
    const models = [];
    const navigation = [];
    const extensions = Object.keys(require.extensions);
    function read(dir2, group) {
        fs.readdirSync(dir2)
            .sort()
            .map(f => path.join(dir2, f))
            .forEach(f => {
            const name = path
                .basename(f)
                .replace(/_/g, " ")
                .replace(/^\d+\s*/, "");
            if (fs.statSync(f).isDirectory()) {
                const items = [];
                group.push({
                    type: "group",
                    name,
                    items
                });
                read(f, items);
            }
            else {
                const ext = path.extname(f);
                if (extensions.includes(ext)) {
                    const mod = require(f);
                    const model = (mod.default || mod);
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
//# sourceMappingURL=navigationBuilder.js.map