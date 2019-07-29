import * as Cotype from "../../../typings";
import React, { Component, Fragment } from "react";
import { match, Redirect, RouteComponentProps } from "react-router-dom";

import api from "../api";
import Form from "./Form";
import ReadOnlyHistory from "./History/ReadOnly";
import { withUser } from "../auth/UserContext";
import { isAllowed, Permission } from "../auth/acl";
import ConflictDialog from "../common/ConflictDialog";
import { VersionItem } from "../../../typings";
import basePath from "../basePath";
import { withModelPaths } from "../ModelPathsContext";

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
export type conflictTypes = "publish" | "unpublish" | "delete" | "media";
type State = {
  versions?: Cotype.VersionItem[];
  itemNotFoundError: boolean;
  conflictingRefs: VersionItem[] | null;
  conflictType: conflictTypes;
};
class Edit extends Component<Props, State> {
  state: State = {
    itemNotFoundError: false,
    conflictingRefs: null,
    conflictType: "delete"
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

  onDelete = (record: any) => {
    const { onDelete } = this.props;
    onDelete(record).then(res => {
      if (res && res.conflictingRefs) {
        this.onConflict(res.conflictingRefs, "delete");
      }
    });
  };

  onConflict = (refs: VersionItem[], type: conflictTypes) => {
    this.setState({
      conflictingRefs: refs,
      conflictType: type
    });
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
          if (err.status === 400) {
            const { body } = err;
            if (body && body.conflictingRefs) {
              this.onConflict(body.conflictingRefs, "unpublish");
            }
          }
        });
    }
  };

  renderErrors = () => {
    const { conflictingRefs, conflictType } = this.state;
    if (!conflictingRefs || !conflictType) return null;
    return (
      <ConflictDialog
        onClose={() => this.setState({ conflictingRefs: null })}
        items={conflictingRefs!}
        type={conflictType}
      />
    );
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
        <Fragment>
          {this.renderErrors()}
          <Form
            versions={versions}
            {...this.props}
            onSave={this.onSave}
            onPublish={this.fetchVersions}
            onUnpublish={this.onUnpublish}
            onDelete={this.onDelete}
          />
        </Fragment>
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
