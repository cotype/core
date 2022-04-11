exports.up = async function(knex, Promise) {
  const { client } = knex.client.config;

  if (client === "mysql2") {
    await knex.schema.alterTable("content_revisions", table => {
      table.text("data", "longtext").alter();
    });
    await knex.schema.alterTable("content_search", table => {
      table.text("text", "longtext").alter();
    });
  }
};

exports.down = async function(knex, Promise) {
  const { client } = knex.client.config;
  if (client === "mysql2") {
    await knex.schema.alterTable("content_revisions", table => {
      table.text("data", "text").alter();
    });
    await knex.schema.alterTable("content_search", table => {
      table.text("data", "text").alter();
    });
  }
};
