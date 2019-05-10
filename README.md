<h2 align="center">
  <img src="https://cotype.dev/logo.svg" alt="cotype" />
</h2>

<p align="center">
  <a href="https://circleci.com/gh/cotype/core/tree/master">
    <img src="https://img.shields.io/circleci/project/github/cotype/core/master.svg" alt="CircleCI">
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

## Content APIs

The data can be accessed either via REST or GraphQL whichever better fits the needs of the particular application. For either flavor the server provides an interactive API explorer that developers can use to browse the content model.

NOTE: Both content APIs are read-only. Modifying content is only possible via the management API that is used by the UI.

## Content Model

The content model is defined in JSON. It describes what content types exist, which fields they have and how they are edited.

Currently the content model is part of the server and changes require a re-deployment/restart in order to take effect. But since the model is plain JSON it would be pretty easy to manage content types directly in the CMS and store is alongside the data.

## Data Storage

The data is stored in a PostgreSQL database. Built-In entities (like users, roles, etc.) live in a traditional relational model, whereas all content is stored as JSON in a common table. Content is immutable and each change creates a new revision. If the publish/draft system is enabled for a given content type, API clients won't see the changes until they are published (or a preview is requested).

There are two materialized views (one for all published, one for the latest versions) that have indexes on the JSON data as well as a full-text index for searching.

## Media Handling

when files are uploaded, only the meta data is stored in the database while the binary data is stored somewhere else. By default it is written to the local filesystem but there are plugins for other storage solutions like Amazon S3.

## Session Handling

The server uses a [cookie-session](https://github.com/expressjs/cookie-session) that holds nothing but the user's id. The cookie is signed to prevent any sort of tampering. Therefore a secret must be provided via the `SESSION_SECRET` env var. If omitted, a random string will be generated, which means that sessions will become invalid once the server is restarted.

## Database

The database connection of the server can be configured by providing an adapter

```ts
import { knexAdapter, postgresqlAdapter, init } from "@cotype/core";

init({ persistenceAdapter: /* your adapter here... */ });
```
