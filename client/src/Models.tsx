import { Model, NavigationItem, Data } from "../../typings";
import React from "react";
import { Switch, Route, match as matchType, Redirect } from "react-router-dom";
import SplitPane from "./common/SplitPane";
import Empty from "./Empty";
import List from "./List/index";
import ModelsSidebar from "./ModelsSidebar";
import ModelsContext from "./ModelsContext";

type Props = {
  match: matchType<any>;
  models: Model[];
  navigation: NavigationItem[];
  onChange?: (model: Model, id: string, data: Data) => void;
};
export default function Models({ match, models, navigation, onChange }: Props) {
  return (
    <ModelsContext.Provider value={models}>
      <SplitPane width={200}>
        <Route
          path={`${match.path}/:type?`}
          render={p => (
            <ModelsSidebar
              models={models}
              navigation={navigation}
              match={p.match}
            />
          )}
        />

        <Switch>
          <Route
            path={`${match.path}/:type`}
            render={props => {
              const { type } = props.match.params;
              const model = models.find(m => m.name === type);
              if (!model) {
                console.error("Unknown model: " + type);
                console.error("Redirect to: " + match.path);
                return <Redirect to={`${match.path}`} />;
              }
              return (
                <List key={type} model={model} onChange={onChange} {...props} />
              );
            }}
          />
          <Route path={match.path} component={Empty} />
        </Switch>
      </SplitPane>
    </ModelsContext.Provider>
  );
}
