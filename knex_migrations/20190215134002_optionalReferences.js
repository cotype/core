exports.up = async function(knex, Promise) {
  await knex.schema.alterTable("content_references", table => {
    table
      .boolean("optional")
      .notNullable()
      .defaultTo(false);
  });
};

exports.down = async function(knex, Promise) {
  await knex.schema.alterTable("content_references", table => {
    table.dropColumn("optional");
  });
};
