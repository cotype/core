exports.up = async function(knex, Promise) {
  await knex.schema.alterTable("contents", table => {
    table.datetime("visibleFrom");
    table.datetime("visibleUntil");
  });
};

exports.down = async function(knex, Promise) {
  await knex.schema.alterTable("contents", table => {
    table.dropColumn("visibleFrom");
    table.dropColumn("visibleUntil");
  });
};
