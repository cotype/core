import { Model, Principal, User, Item, Data } from "../../../typings";
import React, { Component, Fragment } from "react";
import { Route, Switch, match as matchType, Redirect } from "react-router-dom";
import { History } from "history";
import SplitPane from "../common/SplitPane";
import { Background } from "../common/page";
import Edit from "../Edit";
import View from "./List";
import api from "../api";
import { isAllowed, Permission } from "../auth/acl";
import { withUser } from "../auth/UserContext";
import ErrorBoundary from "../ErrorBoundary";
import { IFrameView } from "./IFrameView";

enum Collection {
  IFrame = "iframe",
  Singleton = "singleton",
  None = "none"
}

type Props = {
  user: (Principal & User) | null;
  model: Model;
  match: matchType<any>;
  history: History;
  onChange?: (
    model: Model,
    id: string,
    data: Data,
    activeLanguages?: string[]
  ) => void;
};

type State = {
  singletonData: Item | null;
};
class List extends Component<Props, State> {
  listView: any = React.createRef();

  state: State = {
    singletonData: null
  };

  constructor(props) {
    super(props);

    if (props.model.collection === Collection.Singleton) {
      this.fetchSingleton();
    }
  }

  fetchSingleton = () => {
    const { model } = this.props;
    api.list(model, { limit: 1 }).then(({ items }) => {
      if (items.length) {
        const [item] = items;
        this.setState({ singletonData: item });
      }
    });
  };

  onSave = ({
    id,
    isUpdate,
    data,
    activeLanguages
  }: {
    id: string;
    isUpdate: boolean;
    data: any;
    activeLanguages?: string[];
  }) => {
    const { match, history, model, onChange } = this.props;
    if (!isUpdate) {
      history.replace(`${match.url}/edit/${id}`, data);
    }
    if (onChange) onChange(model, id, data, activeLanguages);
    this.listView.current!.refresh();
  };

  duplicate = (id: string) => {
    const { match, history } = this.props;
    history.replace(`${match.url}/clone/${id}`);
  };

  delete = (id: number) => {
    const { match, model, history } = this.props;
    return api
      .del(`/${model.type}/${model.name}/${id}`)
      .then(() => {
        this.listView.current!.delete(id);
        history.replace(match.url);
      })
      .catch(err => {
        if (err.status === 409) {
          const { message } = err.body;
          alert(message);
        }
        if (err.status === 400) {
          return err.body;
        }
      });
  };

  getEditProps = (routeProps: any) => {
    const { id, clone } = routeProps.match.params;
    if (clone) {
      return {
        clone
      };
    }
    return {
      id,
      onDuplicate: () => this.duplicate(id),
      onDelete: () => this.delete(Number(id))
    };
  };

  renderEdit = (props: any) => {
    return (
      <Edit
        {...props}
        model={this.props.model}
        onSave={this.onSave}
        {...this.getEditProps(props)}
      />
    );
  };

  renderSingletonEdit = (props: any) => {
    const { singletonData } = this.state;

    return (
      <Edit
        {...props}
        model={this.props.model}
        id={singletonData ? singletonData.id : undefined}
        onSave={() => {
          this.fetchSingleton();
        }}
      />
    );
  };

  render() {
    const { model, match, user } = this.props;
    if (model.collection === Collection.None) {
      return null;
    }
    if (!user) return null;
    const edit = isAllowed(user, model, Permission.edit);

    if (model.collection === Collection.IFrame && model.iframeOptions) {
      return <IFrameView {...model.iframeOptions} />;
    }
    if (model.collection === Collection.Singleton) {
      return (
        <ErrorBoundary>
          <Switch>
            <Route exact path={match.url} render={this.renderSingletonEdit} />
            <Redirect to={match.url} />
          </Switch>
        </ErrorBoundary>
      );
    }

    return (
      <ErrorBoundary>
        <SplitPane width={320}>
          <Background>
            <View edit={edit} model={model} match={match} ref={this.listView} />
          </Background>
          <Fragment>
            <ErrorBoundary>
              <Switch>
                <Route
                  path={`${match.url}/edit/:id?`}
                  render={this.renderEdit}
                />
                <Route
                  path={`${match.url}/clone/:clone`}
                  render={this.renderEdit}
                />
              </Switch>
            </ErrorBoundary>
          </Fragment>
        </SplitPane>
      </ErrorBoundary>
    );
  }
}

export default withUser(List);
