<h2 align="center">
  <img src="https://cotype.dev/logo.svg" alt="cotype" />
</h2>

<p align="center">
  <a href="https://circleci.com/gh/cotype/core/tree/master">
    <img src="https://circleci.com/gh/cotype/core/tree/master.svg?style=shield" alt="CircleCI">
  </a>
  <a href="https://www.npmjs.com/package/@cotype/core">
    <img src="https://img.shields.io/npm/v/@cotype/core.svg" alt="npm package">
  </a>
  <a href="https://codecov.io/gh/cotype/core/">
    <img src="https://img.shields.io/codecov/c/gh/cotype/core/master.svg" alt="Codecov">
  </a>
  <a href="https://github.com/semantic-release/semantic-release">
    <img src="https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg" alt="semantic-release">
  </a>
  <a href="https://greenkeeper.io/">
    <img src="https://badges.greenkeeper.io/cotype/core.svg" alt="Greenkeeper">
  </a>
</p>
<p>&nbsp;</p>

Cotype manages structured content that can accessed via APIs.
The system itself is not concerned with the actual rendering of the data - this is left completely to the consumer which could be a server that generates HTML, a client-rendered web app or a native app that reads the data via HTTP.

---

> Cotype is not free software.  
> In order to run cotype on a public server you must purchase a valid license.  
> Please contact info@cellular.de for inquiries.

---

## Install

`npm install @cotype/core`

## Usage

```ts
// server.ts
import { init, Opts /* ... */ } from "@cotype/core";

const port = 1337;
const opts: Opts = {
  /* ...see https://github.com/cotype/core#options */
};

/* Init cotype and receive express app */
init(opts).then(({ app }) => {
  /* Make the app listen on a specific port
   * see https://nodejs.org/api/net.html#net_server_listen */
  app.listen(port, () =>
    console.log(`Cotype listening on http://localhost:${port}!`)
  );
}, console.error);
```

## Options

- #### `models?: ModelOpts[]`

  Describes what content types exist, which fields they have and how they are edited.

- #### `persistenceAdapter: Promise<PersistenceAdapter>`

  Adapter providing the database connection of the server.

  Cotype provides a [Knex.js](https://knexjs.org/) adapter that can be configured
  with a [Knex configuration object](https://knexjs.org/#Installation-client).

  ```ts
  import { init, knexAdapter } from "@cotype/core";

  init({
    /* ... */
    persistenceAdapter: knexAdapter({
      /* see https://knexjs.org/#Installation-client */
    })
  });
  ```

- #### `storage: Storage`

  When files are uploaded, the meta data is stored in the database while the
  binary data is stored using this adapter.

  Cotype comes with an adapter that stores all data on the local file system.

  ```ts
  import { init, FsStorage } from "@cotype/core";

  init({
    /* ... */
    storage: new FsStorage("./uploads")
  });
  ```

- #### `thumbnailProvider: ThumbnailProvider`

  Thumbnail creator for uploaded image files.  
  Cotype does not come with a default provider for size-reasons.

  Please see [`@cotype/local-thumbnail-provider`](https://github.com/cotype/local-thumbnail-provider) for a straight-forward implementation.

* #### `basePath?: string`

  **Default: `/`**

  Can be used to mount the app on a sub-path.
  For example `http://localhost:3000/cms`.

  ```ts
  import { init } from "@cotype/core";

  init({
    /* ... */
    basePath: "/cms"
  });
  ```

- #### `sessionOpts?: SessionOpts`

  The server uses a [cookie-session](https://github.com/expressjs/cookie-session)
  that holds nothing but the user's id.

  See [cookie-session#options](https://github.com/expressjs/cookie-session#options)
  for details.

  The cookie is signed to prevent any sort of tampering. Therefore a secret must
  be provided using `sessionOpts.secret` or via the `SESSION_SECRET` env var. If
  omitted, a random string will be generated, which means that sessions will
  become invalid once the server is restarted.

- #### `migrationDir?: string`

  Absolute path to a directory containing content migration scripts. The scripts
  are read in alphabetic order and executed only once. Each script must export a
  function that takes exactly one argument: a [MigrationContext](https://github.com/cotype/core/blob/feature/content-migrations/src/persistence/MigrationContext.ts).

## How it works

### Content APIs

The data can be accessed via REST. The server provides an interactive API explorer that developers can use to browse the content model.

NOTE: THe content API is read-only. Modifying content is only possible via the management API that is used by the UI.

### Content Model

The content model is defined using only primitives, so it can be serialized into JSON. It describes what content types exist, which fields they have and how they are edited.

For a list of available content models check out the [typings file](typings/models.d.ts).

Currently the content model is part of the server and changes require a re-deployment/restart in order to take effect. But since the model is plain JSON it would be pretty easy to manage content types directly in the CMS and store is alongside the data.

### Data Storage

The data is stored in a Database. Built-In entities (like users, roles, etc.) live in a traditional relational model, whereas all content is stored as JSON in a common table. Content is immutable and each change creates a new revision. If the publish/draft system is enabled for a given content type, API clients won't see the changes until they are published (or a preview is requested).

There are two materialized views (one for all published, one for the latest versions) that have indexes on the JSON data as well as a full-text index for searching.

## Contributing

Pull-Requests, Issues, Feedback, Coffee and positive thoughts are very welcome!

If you want to work on this project locally using the development environment
or want to know more about what we consider "internal stuff", please refer
to the [contribution guidelines](https://github.com/cotype/core/blob/master/CONTRIBUTING.md)


.
