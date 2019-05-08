import * as Cotype from "../../../typings";
import React from "react";
const UserContext = React.createContext<Cotype.User & Cotype.Principal | null>(
  null
);
export default UserContext;

/**
 * Typescript:
 * https://stackoverflow.com/questions/50612299/react-typescript-consuming-context-via-hoc
 * https://medium.com/@jrwebdev/react-higher-order-component-patterns-in-typescript-42278f7590fb
 */
interface WithUser {
  user: Cotype.Principal & Cotype.User | null;
}

export function withUser<P extends WithUser>(
  Component: React.ComponentType<P>
) {
  // TODO remove `as any` once this issue is resolved:
  // https://github.com/Microsoft/TypeScript/issues/28938
  return function ComponentWithUser(
    props: Pick<P, Exclude<keyof P, keyof WithUser>>
  ) {
    return (
      <UserContext.Consumer>
        {user => <Component {...props as any} user={user} />}
      </UserContext.Consumer>
    );
  };
}
