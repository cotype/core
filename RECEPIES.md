# Recepies

These code examples are to specific to be part of the project itself
but seem valuable in different scenarios.

## Consuming a Union-Model in Typescript+React

Assuming we have the following union model configured in cotype

```ts
const fooBarUnion = {
  type: "union",
  types: {
    foo: {
      type: "object",
      fields: {
        children: {
          type: "string"
        }
      }
    },
    bar: {
      type: "object",
      fields: {
        children: {
          level: "number"
        }
      }
    }
  }
};
```

When consuming the API we will receive an array of objects that either have a
`children` property of type `string` or a `level` property of type number.
Each entry also brings it's `_type`, which we can use to [discriminate](https://basarat.gitbooks.io/typescript/content/docs/types/discriminated-unions.html).

The [build-client](https://github.com/cotype/build-client) will type them as:

```ts
type FooBarUnion = Array<
  { _type: "foo"; children: string } | { _type: "bar"; level: number }
>;
```

We now want to implement react components that can render each possible type and
use only the existing properties.

We want to receive type errors in the following scenarios:

- React component requires a prop not provided by the api
- API provides a type but no component is configured to render it
- API type changes but we did not update the component

### Introducing: `createUnion`

```tsx
import React, { ReactElement } from "react";

type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
type Model = {
  _type: string;
  [key: string]: any;
};
export type UnionHandlers<S extends Model[], R = void> = {
  [k in S[number]["_type"]]: (
    props: Omit<Extract<S[number], { _type: k }>, "_type">
  ) => R
};

export default function createUnion<S extends Model[]>(
  comps: UnionHandlers<S, ReactElement>
) {
  return function Union({ children }: { children: S }) {
    return (
      <>
        {children.map(({ _type, ...props }) => {
          const Comp = comps[_type];
          /* We need to use any since `props` is still a union of all possible
             models because we have not explicitly discriminated the model.
             But since comps is securely typed, we know that `Comp` can handle
             this exact props. */
          return <Comp {...props as any} />;
        })}
      </>
    );
  };
}
```

### Usage

```tsx
import createUnion from "./createUnion";

type FooBarUnion = Array<
  { _type: "foo"; children: string } | { _type: "bar"; level: number }
>;

const FooBar = createUnion<FooBarUnion>({
  foo({ children }) {
    return <div>{children}</div>;
  },
  bar({ level }) {
    return <div>{level}</div>;
  }
});

function Blog({ sections }: { sections: FooBarUnion }) {
  return <FooBar>{sections}</FooBar>;
}
```

We now get errors when:

- changing `_type: "foo"` to something else
- removing `bar` implementation from `createUnion` parameter
- passing nothing or anything else as children into `<FooBar>`
- not returning a react element in any of the `createUnion` implementations
- Using a parameter that is not provided in the API

### Additional Notes

#### Pass reusable components to createUnion

We do not need to implement the components directly in the createUnion call.
We can also import a reusable component from our library and pass it

```tsx
// Headline.tsx
import React from "react";
type Props = {
  children: ReactNode;
};
export default function Headline({ children }: Props) {
  return <h1>{children}</h1>;
}
```

```tsx
import Headline from "./Headline";
/* ... */
const FooBar = createUnion<FooBarUnion>({
  foo: Headline
  /* ... */
});
```

#### UnionHandlers

You can use `UnionHandlers` type helper for other (non-react) cases or to
type-safely implement them before passing into `createUnion`

```ts
import { UnionHandlers } from "./createUnion";

const handlers: UnionHandlers<FooBarUnion, any> = {
  foo: console.log,
  bar: console.error
};

const sections: FooBarUnion = await getSections();

sections.forEach(section => {
  switch (section._type) {
    case "foo":
      return handlers.foo(section);
    case "bar":
      return handlers.bar(section);
  }
});
```
