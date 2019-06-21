exports.up = async function(knex, Promise) {
  await knex.schema.alterTable("content_references", table => {
    table.string('fieldNames')
  });
};

exports.down = async function(knex, Promise) {
  await knex.schema.alterTable("content_references", table => {
    table.dropColumn("fieldNames");
  });
};
