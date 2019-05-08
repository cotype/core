exports.up = async function(knex, Promise) {
  await knex.schema.alterTable("content_values", table => {
    table.string("literal_lc");
  });
  // Copy values from literal to literal_lc as lowercase values
  await knex.schema.raw(
    "UPDATE content_values SET literal_lc = LOWER(literal)"
  );
};

exports.down = async function(knex, Promise) {
  await knex.schema.alterTable("content_values", table => {
    table.dropColumn("literal_lc");
  });
};
