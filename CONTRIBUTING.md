# Thanks for contributing to @cotype/core

## Commits + Releases

We are using [semantic-release](https://semantic-release.gitbook.io/semantic-release/)
to create npm releases based on the commit history.

This requires that you write your commits following the
[Angular Commit Message Conventions](https://github.com/angular/angular.js/blob/master/DEVELOPERS.md#-git-commit-guidelines)

Here is an example of the release type that will be done based on a commit messages:

| Commit message                                                                                                                                                                                   | Release type               |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------- |
| `fix(pencil): stop graphite breaking when too much pressure applied`                                                                                                                             | Patch Release              |
| `feat(pencil): add 'graphiteWidth' option`                                                                                                                                                       | ~~Minor~~ Feature Release  |
| `perf(pencil): remove graphiteWidth option`<br><br>`BREAKING CHANGE: The graphiteWidth option has been removed.`<br>`The default graphite width of 10mm is always used for performance reasons.` | ~~Major~~ Breaking Release |

See [Semantic release docs](https://github.com/semantic-release/semantic-release#how-does-it-work) for more details

## Architecture

This repo provides the `@cotype/core` package

internally we have two other packages: client and demo

- **demo**: an example/dev configuration for the server
- **client**: the frontend which is bundled within the server releases

## Development

To bootstrap the project and start a development server do the following:

```bash
npm install #once
npm start
```

## Login

When the server is started for the first time, the necessary tables are created and an inital admin user is created with the following credentials:

```
Email: admin@cotype.dev
Password: admin
```
