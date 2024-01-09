"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const content_migrations_test_1 = require("../content_migrations.test");
async function default_1(ctx) {
    await ctx.removeField(content_migrations_test_1.initialModel.name, "removeMe");
}
exports.default = default_1;
//# sourceMappingURL=003_third.js.map