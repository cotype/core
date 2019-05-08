import { Model } from "../../typings";
import React from "react";
const ModelsContext = React.createContext<Model[]>([]);
export default ModelsContext;

export function withModels(Component) {
  return props => (
    <ModelsContext.Consumer>
      {models => <Component {...props} models={models} />}
    </ModelsContext.Consumer>
  );
}
