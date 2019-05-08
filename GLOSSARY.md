# Glossary

This document intends to define terms that are used across the project
and the contexts in which they might be used in.

### (cotype-) server

The generic implementation of the cotype backend.
It's intended to be configured by a [CMS](#a-single-cms).

### (cotype-) client

A generic frontend that uses the admin API of the [server](#cotype-server).

### (A single) CMS

A piece of software that configures the [server](#cotype-server) for a
specific use case.

### (The) Demo

The example [CMS](#a-single-cms) in this repository.

### Model

A model describes the shape of a [data-set](#data-set) and holds meta information
about it.

Models are used to configure the [CMS](#a-single-cms).

The [server](#cotype-server) has internal [model types](#model-type) like
settings and media but also supports [content models](#content-model) that are
defined by the [CMS](#a-single-cms).

### Model Type

All custom [models](#model) used to configure the server are of type "content".
But the server also uses other types like "setting" or "media".

### Model Name

Unique name of a [model](#model), used to tie a [data-set](#data-set) to a
specific [model](#model).

### Content Model

A [model](#model) of [type](#model-type) "content". Which can be implicit since
all custom models defined by the [CMS](#a-single-cms) are of type content.

### Data(-Set)

Generic name for any data entity.

### Data(-set) Type

Same as [model name](#model-name) but in the context of a [data-set](#data-set).
A [data-set](#data-set) has a type that connects it to a single [model](#model).

### Content

A content is a specific [data-set](#data-set) that is modeled after one of the
[content models](#content-model).

### Content type

Alias for [data-set type](#data-set-type) in the context of a [content](#content).

### Setting

A setting is a specific [data-set](#data-set) that is modeled after the
[servers](#cotype-server) internal setting [model](#model). Or in other words,
a [data-set](#data-set) with the [modelType](#model-type) "setting".

### Media (Entity)

A media entity is a specific [data-set](#data-set) that is modeled after the
[servers](#cotype-server) internal media [model](#model). Or in other words,
a [data-set](#data-set) with the [modelType](#model-type) "media".

### Field

Fields are defined by a [model](#model). When creating a [data-set](#data-set),
the user of a [CMS](#a-single-cms) fills this fields with custom data.
