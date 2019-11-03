import * as Cotype from "../../../typings";
import React, { Component } from "react";
import { match, Redirect, RouteComponentProps } from "react-router-dom";

import api from "../api";
import Form from "./Form";
import ReadOnlyHistory from "./History/ReadOnly";
import { withUser } from "../auth/UserContext";
import { isAllowed, Permission } from "../auth/acl";
import basePath from "../basePath";
import { withModelPaths } from "../ModelPathsContext";
import ContentConstraintsErrorBoundary from "./ContentConstraintsErrorBoundary";
type Props = RouteComponentProps & {
  user: Cotype.Principal & Cotype.User;
  id: string;
  model: Cotype.Model;
  match: match<any>;
  onDelete: (id) => Promise<Cotype.ErrorResponseBody | void>;
  onSave?: (record: { id: any; data: any }) => void;
  modelPaths: Cotype.ModelPaths;
  baseUrls: Cotype.BaseUrls;
};
type State = {
  versions?: Cotype.VersionItem[];
  itemNotFoundError: boolean;
};
class Edit extends Component<Props, State> {
  state: State = {
    itemNotFoundError: false
  };

  componentDidMount() {
    this.fetchVersions();
  }

  componentDidUpdate(prevProps: Props) {
    const { id } = this.props;
    if (id !== prevProps.id) {
      this.fetchVersions();
    }
  }

  onSave = (record: any) => {
    const { onSave } = this.props;
    this.fetchVersions();
    if (onSave) onSave(record);
  };

  fetchVersions = () => {
    const { id, model } = this.props;
    if (!model.versioned || !id) return;
    api
      .getVersions(model, id)
      .then(versions => {
        return this.setState({ versions });
      })
      .catch(err => {
        if (err.status === 404) {
          this.setState({ itemNotFoundError: true });
        }
      });
  };

  onUnpublish = () => {
    const { model, id } = this.props;
    if (id) {
      api
        .unpublish(model, id)
        .then(() => {
          this.fetchVersions();
        })
        .catch(err => {
          this.setState(() => {
            Object.assign(err.body, { conflictType: "unpublish" });
            throw err;
          });
        });
    }
  };

  render() {
    const { model, user, id, modelPaths } = this.props;
    const { versions, itemNotFoundError } = this.state;
    const canEdit = isAllowed(user, model, Permission.edit);

    if (itemNotFoundError)
      return (
        <Redirect to={`${basePath}${modelPaths[model.type][model.name]}`} />
      );

    if (canEdit && model.writable) {
      return (
        <ContentConstraintsErrorBoundary>
          <Form
            versions={versions}
            {...this.props}
            onSave={this.onSave}
            onPublish={this.fetchVersions}
            onUnpublish={this.onUnpublish}
            onDelete={this.props.onDelete}
          />
        </ContentConstraintsErrorBoundary>
      );
    }

    if (model.versioned && (!versions || !versions.length)) return null;
    return (
      <ReadOnlyHistory
        versions={versions}
        id={id}
        model={model}
        onPublish={this.fetchVersions}
        onUnpublish={this.onUnpublish}
      />
    );
  }
}

export default withModelPaths(withUser(Edit));
