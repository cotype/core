"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function navigstionBuilder(dir1) {
    const models = [];
    const navigation = [];
    const extensions = Object.keys(require.extensions);
    function read(dir2, group) {
        fs_1.default.readdirSync(dir2)
            .sort()
            .map(f => path_1.default.join(dir2, f))
            .forEach(f => {
            const name = path_1.default
                .basename(f)
                .replace(/_/g, " ")
                .replace(/^\d+\s*/, "");
            if (fs_1.default.statSync(f).isDirectory()) {
                const items = [];
                group.push({
                    type: "group",
                    name,
                    items
                });
                read(f, items);
            }
            else {
                const ext = path_1.default.extname(f);
                if (extensions.includes(ext)) {
                    const mod = require(f);
                    const model = (mod.default || mod);
                    models.push(model);
                    group.push({
                        type: "model",
                        name: path_1.default.basename(name, ext),
                        model: model.name
                    });
                }
            }
        });
    }
    read(dir1, navigation);
    return { navigation, models };
}
exports.default = navigstionBuilder;
//# sourceMappingURL=navigationBuilder.js.map