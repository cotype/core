import * as Cotype from "../../typings";
import React, { useContext } from "react";
const ModelPathsContext = React.createContext<{
  modelPaths: Cotype.ModelPaths | null;
  baseUrls: Cotype.BaseUrls | null;
  languages?: Cotype.Language[] | null;
}>({ modelPaths: null, baseUrls: null });
export default ModelPathsContext;

/**
 * Typescript:
 * https://stackoverflow.com/questions/50612299/react-typescript-consuming-context-via-hoc
 * https://medium.com/@jrwebdev/react-higher-order-component-patterns-in-typescript-42278f7590fb
 */
interface WithModelPaths {
  modelPaths: Cotype.ModelPaths | null;
  baseUrls: Cotype.BaseUrls | null;
  languages?: Cotype.Language[] | null;
}

export function withModelPaths<P extends WithModelPaths>(
  Component: React.ComponentType<P>
) {
  return function ComponentWithModelPaths(
    props: Pick<P, Exclude<keyof P, keyof WithModelPaths>>
  ) {
    // TODO remove `as any` once this issue is resolved:
    // https://github.com/Microsoft/TypeScript/issues/28938
    return (
      <ModelPathsContext.Consumer>
        {p => (
          <Component
            {...(props as any)}
            modelPaths={p && p.modelPaths}
            baseUrls={p && p.baseUrls}
            languages={p && p.languages}
          />
        )}
      </ModelPathsContext.Consumer>
    );
  };
}
export const useModelPaths = () => useContext(ModelPathsContext);
