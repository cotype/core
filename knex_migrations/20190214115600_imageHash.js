// Add deleted column to users in order to soft delete users
exports.up = async function(knex, Promise) {
  await knex.schema.alterTable("media", table => {
    table.string("hash").unique();
  });
};

exports.down = async function(knex, Promise) {
  await knex.schema.alterTable("media", table => {
    table.dropColumn("hash");
  });
};
