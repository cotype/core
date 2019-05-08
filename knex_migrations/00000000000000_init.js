exports.up = async function(knex) {
  const { client } = knex.client.config;

  await knex.schema.createTable("media", table => {
    table.string("id").primary();
    table.integer("size");
    table.string("originalname");
    table.string("mimetype");
    table.string("imagetype");
    table.integer("width");
    table.integer("height");
    table.integer("focusX");
    table.integer("focusY");
    table.text("tags");
    if (client === "pg") {
      table.specificType("search", "tsvector");
      table.index("search", null, "gin");
    } else {
      table.text("search");
    }
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });

  if (client === "mysql") {
    await knex.schema.raw("alter table `media` add fulltext (`search`)");
  }

  await knex.schema.createTable("roles", table => {
    table.increments("id").primary();
    table.string("name");
    table.text("permissions");
  });

  await knex.schema.createTable("users", table => {
    table.increments("id").primary();
    table.string("name").unique();
    table.string("email").unique();
    table.string("password");
    table
      .string("picture")
      .references("id")
      .inTable("media");
    table
      .integer("role")
      .unsigned()
      .references("id")
      .inTable("roles");
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("contents", table => {
    table.increments("id").primary();
    table.string("type").notNullable();
    table.integer("latest_rev");
    table.integer("published_rev");
    table
      .boolean("deleted")
      .notNullable()
      .defaultTo(false);
  });

  await knex.schema.createTable("content_revisions", table => {
    table
      .integer("id")
      .unsigned()
      .references("id")
      .inTable("contents")
      .onDelete("CASCADE");

    table.integer("rev");
    table.timestamp("date").defaultTo(knex.fn.now());
    table.text("data").notNullable();
    table
      .integer("author")
      .unsigned()
      .references("id")
      .inTable("users");

    table.primary(["id", "rev"]);
  });

  knex.schema.alterTable("contents", table => {
    table
      .foreign(["id", "latest_rev"])
      .references(["id", "rev"])
      .inTable("content_revisions");
    table
      .foreign(["id", "published_rev"])
      .references(["id", "rev"])
      .inTable("content_revisions");
  });

  await knex.schema.createTable("content_values", table => {
    table.integer("id").unsigned();
    table.integer("rev");
    table.boolean("published");
    table.string("field");
    table.string("literal");
    //table.bigInteger("numeric");
    table.string("numeric");
    table
      .foreign(["id", "rev"])
      .references(["id", "rev"])
      .inTable("content_revisions")
      .onDelete("CASCADE");
    table.index(["field", "literal"]);
    table.index(["field", "numeric"]);
  });

  await knex.schema.createTable("content_search", table => {
    table.integer("id").unsigned();
    table.integer("rev");
    table.boolean("published");
    if (client === "pg") {
      table.specificType("text", "tsvector");
      table.index("text", null, "gin");
    } else {
      table.text("text");
    }
  });

  if (client === "mysql") {
    await knex.schema.raw("alter table `content_search` add fulltext (`text`)");
  }

  await knex.schema.createTable("content_references", table => {
    table.integer("id").unsigned();
    table.integer("rev");
    table
      .string("media")
      .references("id")
      .inTable("media");
    table
      .integer("content")
      .unsigned()
      .references("id")
      .inTable("contents");
    table
      .foreign(["id", "rev"])
      .references(["id", "rev"])
      .inTable("content_revisions")
      .onDelete("CASCADE");
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTable("content_references");
  await knex.schema.dropTable("content_search");
  await knex.schema.dropTable("content_values");
  await knex.schema.dropTable("contents");
  await knex.schema.dropTable("content_revisions");
  await knex.schema.dropTable("users");
  await knex.schema.dropTable("roles");
  await knex.schema.dropTable("media");
};
