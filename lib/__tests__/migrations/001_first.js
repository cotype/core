"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const content_migrations_test_1 = require("../content_migrations.test");
async function default_1(ctx) {
    await ctx.rewrite(content_migrations_test_1.initialModel.name, (data, meta) => {
        if (meta.published) {
            return Object.assign(Object.assign({}, data), { initialField: content_migrations_test_1.publishedData.initialField });
        }
        else if (meta.latest) {
            return Object.assign(Object.assign({}, data), { initialField: content_migrations_test_1.draftsData.initialField });
        }
        return data;
    });
}
exports.default = default_1;
//# sourceMappingURL=001_first.js.map