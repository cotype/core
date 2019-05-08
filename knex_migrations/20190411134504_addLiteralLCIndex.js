exports.up = async function(knex, Promise) {
  await knex.schema.alterTable("content_values", table => {
    table.index(["field", "literal_lc"]);
  });
};

exports.down = async function(knex, Promise) {
  await knex.schema.alterTable("content_values", table => {
    table.dropIndex(["field", "literal_lc"]);
  });
};
