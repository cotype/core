import { initialModel, publishedData, draftsData } from "../content_migrations.test";
export default async function (ctx) {
    await ctx.rewrite(initialModel.name, (data, meta) => {
        if (meta.published) {
            return Object.assign(Object.assign({}, data), { initialField: publishedData.initialField });
        }
        else if (meta.latest) {
            return Object.assign(Object.assign({}, data), { initialField: draftsData.initialField });
        }
        return data;
    });
}
//# sourceMappingURL=001_first.js.map