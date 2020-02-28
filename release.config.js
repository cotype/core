module.exports = {
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/npm",
    process.env.PRE_RELEASE && [
      "decorate-gh-pr/on-release",
      {
        comment:
          "<hr /><p><em><date>[<% print(date.toISOString()) %>]</date></em> Pre-released:<br /><code>@cotype/core@<%= version %></code></p>"
      }
    ],
    !process.env.PRE_RELEASE && "@semantic-release/github"
  ].filter(Boolean)
};
