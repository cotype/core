import MigrationContext from "../../persistence/MigrationContext";
import {
  initialModel,
  publishedData,
  draftsData
} from "../content_migrations.test";

export default async function(ctx: MigrationContext) {
  await ctx.addField(initialModel.name, "newField", (data, meta) => {
    if (meta.published) {
      return publishedData.newField;
    } else if (meta.latest) {
      return draftsData.newField;
    }
    return "";
  });
}
