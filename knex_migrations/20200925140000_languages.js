exports.up = async function(knex, Promise) {
  await knex.schema.alterTable("content_revisions", table => {
    table.string("activeLanguages")
  });
};

exports.down = async function(knex, Promise) {
  await knex.schema.alterTable("content_revisions", table => {
    table.dropColumn("activeLanguages");
  });
};
