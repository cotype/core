const dummyData = require("../content_migrations.test");

const data = [
  {
    id: 1,
    rev: 1,
    published: true,
    text: `migrate me ${dummyData.publishedData.initialField}`
  },
  {
    id: 1,
    rev: 2,
    published: 0,
    text: `migrate me ${dummyData.draftsData.initialField}`
  }
];

exports.seed = knex =>
  knex("content_search")
    .del()
    .then(() => {
      const seedData = [].concat(data);
      const chunks = [];

      while (seedData.length) {
        chunks.push(seedData.splice(0, 100));
      }

      return chunks.reduce(async (memo, chunk) => {
        await memo;

        return knex("content_search").insert(chunk);
      }, Promise.resolve());
    });
