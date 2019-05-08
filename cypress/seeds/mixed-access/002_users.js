// this file has been auto-generated by cotype seed creation
const data = [
  {
    id: 1,
    name: "Administrator",
    email: "admin@cotype.dev",
    password: "$2b$10$7rT05SUeqwOxXSHurYYtyOEVhPEgKKDqWYoIsW6r0tictupDkz1Ke",
    picture: null,
    role: 1,
    created_at: "2019-01-24 12:33:56"
  },
  {
    id: 2,
    name: "Mixed-Access",
    email: "mixed-access@cotype.dev",
    password: "$2b$10$JuAmli5gvVMYvJnUckHVTewl34vn39LMgODEfeiSIR.OfR9dOT8Gi",
    picture: null,
    role: 2,
    created_at: "2019-01-24 12:36:35"
  }
];

exports.seed = knex =>
  knex("users")
    .del()
    .then(() => {
      const seedData = [].concat(data);
      const chunks = [];

      while (seedData.length) {
        chunks.push(seedData.splice(0, 100));
      }

      return chunks.reduce(async (memo, chunk) => {
        await memo;

        return knex("users").insert(chunk);
      }, Promise.resolve());
    });
