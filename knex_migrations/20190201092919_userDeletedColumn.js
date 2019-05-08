// Add deleted column to users in order to soft delete users
exports.up = async function(knex, Promise) {
  await knex.schema.alterTable("users", table => {
    table
      .boolean("deleted")
      .notNullable()
      .defaultTo(false);
  });
};

exports.down = async function(knex, Promise) {
  const { client } = knex.client.config;

  // TODO: find a solution to drop column in sqlite without foreign key violations
  if (client !== "sqlite3") {
    await knex.schema.alterTable("users", table => {
      table.dropColumn("deleted");
    });
  }
};
