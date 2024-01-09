"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const content_migrations_test_1 = require("../content_migrations.test");
async function default_1(ctx) {
    await ctx.addField(content_migrations_test_1.initialModel.name, "newField", (data, meta) => {
        if (meta.published) {
            return content_migrations_test_1.publishedData.newField;
        }
        else if (meta.latest) {
            return content_migrations_test_1.draftsData.newField;
        }
        return "";
    });
}
exports.default = default_1;
//# sourceMappingURL=002_second.js.map