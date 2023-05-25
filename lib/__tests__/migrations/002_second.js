import { initialModel, publishedData, draftsData } from "../content_migrations.test";
export default async function (ctx) {
    await ctx.addField(initialModel.name, "newField", (data, meta) => {
        if (meta.published) {
            return publishedData.newField;
        }
        else if (meta.latest) {
            return draftsData.newField;
        }
        return "";
    });
}
//# sourceMappingURL=002_second.js.map