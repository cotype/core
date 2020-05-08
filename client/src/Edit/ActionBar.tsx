import * as Cotype from "../../../typings";
import React, { Component, Fragment, version } from "react";
import { withRouter } from "react-router-dom";
import { RouteComponentProps } from "react-router";
import styled, { css } from "styled-components/macro";
import Button from "../common/Button";
import { paths } from "../common/icons";
import { withUser } from "../auth/UserContext";
import { isAllowed, Permission } from "../auth/acl";

import api from "../api";
import { conflictTypes } from ".";
import ConflictDialog from "../common/ConflictDialog";
import { testable } from "../utils/helper";

const { edit, publish } = Permission;

const baseButtonClass = css`
  margin-left: 1em;
`;

const deactivatedModelAction = css`
  cursor: auto;
  & > svg {
    color: var(--disabled-color);
  }
  :hover {
    & > svg {
      color: var(--disabled-color);
    }
  }
`;
const deactivatedContentAction = css`
  cursor: auto;
  background: var(--disabled-color);
  :hover {
    background: var(--disabled-color);
  }
`;

const unpublishButtonClass = css`
  background: #47d08c;
  & > svg {
    transform: rotate(180deg);
  }
  :hover {
    background: #52eb9f;
  }
  ${baseButtonClass};
`;
const publishButtonClass = css`
  background: #f9b750;
  :hover {
    background: #f9c87b;
  }
  ${baseButtonClass};
`;

const previewButtonClass = css`
  background: #4a4a4a;
  :hover {
    background: #686868;
  }
  ${baseButtonClass};
`;

const modelActionButtons = css`
  background: none;
  padding-left: 0;
  & > svg {
    color: var(--primary-color);
  }
  :hover {
    background: none;
    & > svg {
      color: var(--accent-color);
    }
  }
`;

const Root = styled("div")`
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
  box-sizing: border-box;
  position: sticky;
  top: 0;
  width: 100%;
  background: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 2;
  padding: 0.65em 2em 0.65em 1em;
`;

type Props = RouteComponentProps<any> & {
  user: Cotype.Principal & Cotype.User;
  isNew?: boolean;
  hasErrors?: boolean;
  isDirty?: boolean;
  isSubmitting?: boolean;
  hasSchedule: boolean;
  onDuplicate?: (ev?: any) => void;
  onDelete?: (ev?: any) => void;
  onPublishChange?: (ev?: any) => void;
  onUnpublish?: () => void;
  onRestore?: () => void;
  onHistory?: () => void;
  onPreview?: () => void;
  onSchedule?: () => void;
  versions?: (Cotype.VersionItem & { published: boolean })[];
  activeVersion?: number;
  model: Cotype.Model;
  submitForm?: () => void;
  errors?: { key: string };
};

type State = {
  conflictingRefs: Cotype.VersionItem[] | null;
  conflictType: conflictTypes;
};

class ActionBar extends Component<Props, State> {
  state: State = {
    conflictingRefs: null,
    conflictType: "publish"
  };
  get activeVersion() {
    const { versions, activeVersion } = this.props;
    if (versions && activeVersion) {
      return versions.find(v => v.rev === activeVersion);
    }
    if (versions && version.length) {
      return versions[0];
    }
    return undefined;
  }

  onPublish = () => {
    const { model, onPublishChange } = this.props;
    if (this.activeVersion) {
      api
        .publish(model, this.activeVersion.id, this.activeVersion.rev)
        .then(() => {
          if (onPublishChange) onPublishChange();
        })
        .catch(err => {
          if (err.status === 400) {
            const { body } = err;
            if (body.conflictingRefs) {
              this.setState({
                conflictingRefs: body.conflictingRefs,
                conflictType: "publish"
              });
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

  renderModelActions = () => {
    const {
      isNew,
      onDuplicate,
      onDelete,
      onHistory,
      model,
      user,
      versions
    } = this.props;

    const canEdit = isAllowed(user, model, edit);
    const inSettings = model.type === "settings";
    const isSingleton = model.collection === "singleton";

    const actions: any = [];

    const buttonClass = isNew
      ? css`
          ${modelActionButtons};
          ${deactivatedModelAction};
        `
      : modelActionButtons;

    if (canEdit) {
      if (onDelete && !isSingleton) {
        actions.push(
          <Button
            {...testable("delete")}
            css={buttonClass}
            icon={paths.Trash}
            type="button"
            onClick={!isNew ? onDelete : undefined}
          />
        );
      }

      if (onDuplicate && !inSettings && !isSingleton) {
        actions.push(
          <Button
            css={buttonClass}
            icon={paths.Duplicate}
            type="button"
            onClick={!isNew ? onDuplicate : undefined}
          />
        );
      }
    }
    if (!inSettings) {
      const hasVersions = versions ? versions.length > 1 : false;
      actions.push(
        <Button
          css={
            hasVersions
              ? buttonClass
              : css`
                  ${modelActionButtons};
                  ${deactivatedModelAction}
                `
          }
          icon={paths.History}
          type="button"
          onClick={onHistory}
          disabled={!hasVersions}
        />
      );
    }

    return (
      <div>
        {actions.map((action, index) => (
          <Fragment key={index}>{action}</Fragment>
        ))}
      </div>
    );
  };

  renderContentActions = () => {
    const {
      isNew,
      isDirty,
      isSubmitting,
      hasSchedule,
      model,
      submitForm,
      user,
      onSchedule,
      onUnpublish,
      onPreview
    } = this.props;

    const canEdit = isAllowed(user, model, edit);
    const canPublish = isAllowed(user, model, publish);
    const isPublished = this.activeVersion && this.activeVersion.published;

    const inSettings = model.type === "settings";
    const isSingleton = model.collection === "singleton";

    const alwaysShowSave = inSettings || model.external || !canPublish;
    const showSave = canEdit && (isDirty || isNew || alwaysShowSave);
    const showPublish = canPublish && !showSave;
    const showSchedule = showPublish && !isSingleton;
    const showPreview = model.urlPath && !inSettings && onPreview;

    const actions: any = [];

    if (showSchedule) {
      actions.push(
        <Button
          icon={hasSchedule ? paths.CalendarClock : paths.Calendar}
          type="button"
          onClick={onSchedule}
          css={modelActionButtons}
          disabled={false}
        />
      );
    }

    if (showSave) {
      const disabled = !isDirty || isSubmitting;
      actions.push(
        <Button
          icon={paths.Save}
          type="button"
          onClick={submitForm}
          css={disabled ? deactivatedContentAction : undefined}
          disabled={disabled}
        >
          Save
        </Button>
      );
    }
    if (showPublish) {
      if (!isPublished) {
        actions.push(
          <Button
            css={publishButtonClass}
            icon={paths.Publish}
            type="button"
            onClick={this.onPublish}
            disabled={false}
          >
            Publish
          </Button>
        );
      } else if (!isSingleton) {
        actions.push(
          <Button
            css={unpublishButtonClass}
            icon={paths.Publish}
            type="button"
            onClick={onUnpublish}
            disabled={false}
          >
            Unpublish
          </Button>
        );
      }
    }

    if (showPreview) {
      actions.push(
        <Button
          css={
            isDirty || isNew
              ? css`
                  ${previewButtonClass};
                  ${deactivatedModelAction};
                `
              : previewButtonClass
          }
          disabled={isDirty || isNew}
          icon={paths.Details}
          onClick={onPreview}
        />
      );
    }

    return (
      <div>
        {actions.map((action, index) => (
          <Fragment key={index}>{action}</Fragment>
        ))}
      </div>
    );
  };

  render() {
    return (
      <Root>
        {this.renderErrors()}
        {this.renderModelActions()}
        <div style={{ flex: 1 }} />
        {this.renderContentActions()}
      </Root>
    );
  }
}

export default withRouter(withUser(ActionBar));
