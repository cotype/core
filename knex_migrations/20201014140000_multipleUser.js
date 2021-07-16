exports.up = async function (knex, Promise) {
  await knex.schema.alterTable("users", table => {
    table.dropUnique(['name'])
    table.dropUnique(['email'])
    table.unique(['name','deleted'])
    table.unique(['email','deleted'])
  });
};

exports.down = async function (knex, Promise) {
  await knex.schema.alterTable("users", table => {
    table.dropUnique(['name','deleted'])
    table.dropUnique(['email','deleted'])
    table.unique(['name'])
    table.unique(['email'])
  });
};
