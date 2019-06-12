exports.up = async function(knex, Promise) {
  const { client } = knex.client.config;

  if (client === "mysql") {
    await knex.schema.alterTable("content_revisions", table => {
      table.text("data", "mediumtext").alter();
    });
    await knex.schema.alterTable("content_search", table => {
      table.text("text", "mediumtext").alter();
    });
  }
};

exports.down = async function(knex, Promise) {
  const { client } = knex.client.config;
  if (client === "mysql") {
    await knex.schema.alterTable("content_revisions", table => {
      table.text("data", "text").alter();
    });
    await knex.schema.alterTable("content_search", table => {
      table.text("data", "text").alter();
    });
  }
};
