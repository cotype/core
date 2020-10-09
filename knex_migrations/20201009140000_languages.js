exports.up = async function (knex, Promise) {
  await knex.schema.alterTable("content_values", table => {
    table.string("lang");
  });
};

exports.down = async function (knex, Promise) {
  await knex.schema.alterTable("content_values", table => {
    table.dropColumn("lang");
  });
};
