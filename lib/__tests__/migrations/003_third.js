import { initialModel } from "../content_migrations.test";
export default async function (ctx) {
    await ctx.removeField(initialModel.name, "removeMe");
}
//# sourceMappingURL=003_third.js.map