import React, { Component } from "react";
import { ApiError } from "../api";
import ConflictDialog, { ConflictTypes } from "../common/ConflictDialog";
import { VersionItem } from "../../../typings";

type State = {
  hasError: boolean;
  conflictingRefs?: VersionItem[];
  conflictType?: ConflictTypes;
};
export default class ContentConstraintsErrorBoundary extends Component<
  {},
  State
> {
  static getDerivedStateFromError(error) {
    // ReferenceConflictErrors have 400 status code
    // If this is not a ReferenceConflictError we want to the
    // error to bubble on

    if (!(error instanceof ApiError && error.status === 400)) throw error;

    const { body } = error;

    return {
      hasError: true,
      conflictingRefs: body.conflictingRefs,
      conflictType: body.conflictType
    };
  }

  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  componentDidCatch(error, info) {
    console.error(error);
  }

  renderErrors = () => {
    const { conflictingRefs, conflictType } = this.state;
    return (
      <ConflictDialog
        onClose={() => this.setState({ hasError: false })}
        items={conflictingRefs!}
        type={conflictType!}
      />
    );
  };

  render() {
    const { children } = this.props;
    const { hasError } = this.state;

    return (
      <>
        {hasError && this.renderErrors()}
        {children}
      </>
    );
  }
}
