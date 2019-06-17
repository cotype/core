import { Info } from "../../typings";
import React from "react";
import { ReactComponentLike } from "prop-types";
const MediaInfoContext = React.createContext<Info["media"] | undefined>(
  undefined
);
export default MediaInfoContext;

export function withMediaInfo(Component: ReactComponentLike) {
  return (props: any) => (
    <MediaInfoContext.Consumer>
      {info => <Component {...props} media={info} />}
    </MediaInfoContext.Consumer>
  );
}
