const dummyData = require("../content_migrations.test");

const data = [
  {
    id: 1,
    rev: 1,
    date: "2019-07-31 15:27:28",
    data: `{"initialField":"${dummyData.publishedData.initialField}", "removeMe": "true"}`,
    author: 1
  },
  {
    id: 1,
    rev: 2,
    date: "2019-07-31 15:27:28",
    data: `{"initialField":"${dummyData.draftsData.initialField}", "removeMe": "true"}`,
    author: 1
  }
];

exports.seed = knex =>
  knex("content_revisions")
    .del()
    .then(() => {
      const seedData = [].concat(data);
      const chunks = [];

      while (seedData.length) {
        chunks.push(seedData.splice(0, 100));
      }

      return chunks.reduce(async (memo, chunk) => {
        await memo;

        return knex("content_revisions").insert(chunk);
      }, Promise.resolve());
    });
