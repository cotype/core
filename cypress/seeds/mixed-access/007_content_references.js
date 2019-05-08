// this file has been auto-generated by cotype seed creation
const data = [];

exports.seed = knex =>
  knex("content_references")
    .del()
    .then(() => {
      const seedData = [].concat(data);
      const chunks = [];

      while (seedData.length) {
        chunks.push(seedData.splice(0, 100));
      }

      return chunks.reduce(async (memo, chunk) => {
        await memo;

        return knex("content_references").insert(chunk);
      }, Promise.resolve());
    });
