const dummyData = require("../content_migrations.test");

const data = [
  {
    id: 1,
    rev: 1,
    published: true,
    field: "initialField",
    literal: dummyData.publishedData.initialField,
    numeric: null,
    literal_lc: dummyData.publishedData.initialField.toLowerCase()
  },
  {
    id: 1,
    rev: 2,
    published: 0,
    field: "initialField",
    literal: dummyData.draftsData.initialField,
    numeric: null,
    literal_lc: dummyData.draftsData.initialField.toLowerCase()
  }
];

exports.seed = knex =>
  knex("content_values")
    .del()
    .then(() => {
      const seedData = [].concat(data);
      const chunks = [];

      while (seedData.length) {
        chunks.push(seedData.splice(0, 100));
      }

      return chunks.reduce(async (memo, chunk) => {
        await memo;

        return knex("content_values").insert(chunk);
      }, Promise.resolve());
    });
