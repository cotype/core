exports.up = async function(knex, Promise) {
  await knex.schema.createTable("content_migrations", table => {
    table.string("name").primary();
    table.string("state").notNullable();
  });
};

exports.down = async function(knex, Promise) {
  await knex.schema.dropTable("content_migrations");
};
