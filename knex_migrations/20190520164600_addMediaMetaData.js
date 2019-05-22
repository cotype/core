exports.up = async function(knex, Promise) {
  await knex.schema.alterTable("media", table => {
    table.string("credit");
    table.string("alt");
  });
};

exports.down = async function(knex, Promise) {
  await knex.schema.alterTable("media", table => {
    table.dropColumn("credit");
    table.dropColumn("alt");
  });
};
