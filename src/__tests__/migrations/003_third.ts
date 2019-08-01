import MigrationContext from "../../persistence/MigrationContext";
import { initialModel } from "../content_migrations.test";

export default async function(ctx: MigrationContext) {
  await ctx.removeField(initialModel.name, "removeMe");
}
