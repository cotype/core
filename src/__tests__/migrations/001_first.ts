import MigrationContext from "../../persistence/MigrationContext";
import {
  initialModel,
  publishedData,
  draftsData
} from "../content_migrations.test";

export default async function(ctx: MigrationContext) {
  await ctx.rewrite(initialModel.name, (data, meta) => {
    if (meta.published) {
      return { ...data, initialField: publishedData.initialField };
    } else if (meta.latest) {
      return { ...data, initialField: draftsData.initialField };
    }
    return data;
  });
}
