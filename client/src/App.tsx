import {
  Model,
  NavigationItem,
  User,
  Principal,
  Data,
  ModelPaths,
  BaseUrls,
  Language
} from "../../typings";
import * as React from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect
} from "react-router-dom";
import styled from "styled-components/macro";
import { UploadProvider, createXhrClient } from "react-use-upload";
import basePath from "./basePath";
import api from "./api";
import Header, { HEIGHT } from "./Header";
import Models from "./Models";
import ModelPathsContext from "./ModelPathsContext";
import Media from "./Media";
import Login from "./auth/Login";
import UserContext from "./auth/UserContext";
import IconGallery from "./IconGallery";
import List from "./List";
import Dashboard from "./Dashboard";
import SplitPane from "./common/SplitPane";
import ErrorBoundary from "./ErrorBoundary";
import EditURLRedirect from "./common/EditURLRedirect";

const Root = styled("div")`
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const Main = styled("div")`
  position: relative;
  flex: 1;
  display: flex;
  max-height: calc(100vh - ${HEIGHT});
`;

type State = {
  models?: {
    settings: Model[];
    content: Model[];
    media: Model[];
  };
  user?: User & Principal;
  navigation?: NavigationItem[];
  modelPaths?: ModelPaths;
  baseUrls?: BaseUrls;
  languages?: Language[];
};
class App extends React.Component<{}, State> {
  state: State = {};

  fetchInfo = () => {
    api
      .get("/info")
      .then(info => this.setState(info))
      .catch(err => {
        this.setState({ user: undefined });
      });
  };

  componentDidMount() {
    this.fetchInfo();
  }

  settingsChanged = (model: Model, id: string, data: Data) => {
    if (model.name === "User") {
      this.fetchInfo();
    }
  };

  render() {
    const {
      models,
      user,
      navigation = [],
      modelPaths = null,
      baseUrls = null,
      languages = null
    } = this.state;

    if (!user) {
      return <Login onSuccess={this.fetchInfo} />;
    }
    if (!models) return null;

    return (
      <ErrorBoundary>
        <UploadProvider client={createXhrClient({ baseUrl: api.baseURI })}>
          <UserContext.Provider value={user}>
            <ModelPathsContext.Provider
              value={{ modelPaths, baseUrls, languages }}
            >
              <Router>
                <Root>
                  <Header navigation={navigation} />
                  <ErrorBoundary>
                    <Main>
                      <Switch>
                        <Route
                          path={`${basePath}/dashboard`}
                          render={props => <Dashboard />}
                        />
                        {navigation.map(item => (
                          <Route
                            key={item.path}
                            path={`${basePath}${item.path}`}
                            render={routeProps => {
                              switch (item.type) {
                                case "model":
                                  return (
                                    <SplitPane>
                                      <List
                                        {...routeProps}
                                        model={
                                          models.content.find(
                                            ({ name }) => name === item.model
                                          ) as Model
                                        }
                                      />
                                    </SplitPane>
                                  );
                                default:
                                  return (
                                    <Models
                                      {...routeProps}
                                      models={models.content}
                                      navigation={item.items}
                                    />
                                  );
                              }
                            }}
                          />
                        ))}
                        <Route
                          path={`${basePath}/media`}
                          render={props => (
                            <Media {...props} model={models.media} />
                          )}
                        />
                        <Route
                          path={`${basePath}/settings`}
                          render={props => (
                            <Models
                              {...props}
                              models={models.settings}
                              navigation={models.settings.map(
                                ({ name, plural }) =>
                                  ({
                                    type: "model",
                                    model: name,
                                    path: `/settings/${name}`,
                                    name: plural
                                  } as NavigationItem)
                              )}
                              onChange={this.settingsChanged}
                            />
                          )}
                        />
                        <Route
                          path={`${basePath}/icons`}
                          component={IconGallery}
                        />
                        <Route
                          path={`${basePath}/editURL`}
                          render={props => (
                            <EditURLRedirect
                              {...props}
                              contentModels={models.content}
                              navigation={navigation}
                            />
                          )}
                        />
                        <Route exact path={basePath}>
                          <Redirect to={`${basePath}/dashboard`} />
                        </Route>
                      </Switch>
                    </Main>
                  </ErrorBoundary>
                </Root>
              </Router>
            </ModelPathsContext.Provider>
          </UserContext.Provider>
        </UploadProvider>
      </ErrorBoundary>
    );
  }
}

export default App;
