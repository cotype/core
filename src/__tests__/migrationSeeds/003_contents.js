// this file has been auto-generated by cotype seed creation
const data = [
  {
    id: 1,
    type: "migrateMe",
    latest_rev: 2,
    published_rev: 1,
    deleted: 0,
    visibleFrom: null,
    visibleUntil: null
  }
];

exports.seed = knex =>
  knex("contents")
    .del()
    .then(() => {
      const seedData = [].concat(data);
      const chunks = [];

      while (seedData.length) {
        chunks.push(seedData.splice(0, 100));
      }

      return chunks.reduce(async (memo, chunk) => {
        await memo;

        return knex("contents").insert(chunk);
      }, Promise.resolve());
    });