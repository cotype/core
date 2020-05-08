import * as Cotype from "../../../../typings";
import React, { Component } from "react";
import History from "./History";
import SplitPane from "../../common/SplitPane";
import VersionList from "../VersionList";

type Props = {
  id: string;
  model: Cotype.Model;
  versions: (Cotype.VersionItem & { published: boolean })[];
  onSelect?: (rev: string) => void;
  onUnpublish: () => void;
};

type State = {
  activeVersion?: string | number;
};
export default class HistoryChooser extends Component<Props, State> {
  state: State = {};

  constructor(props) {
    super(props);
    const { versions } = this.props;
    this.state = {
      activeVersion:
        versions && versions[0] ? String(versions[0].latest_rev - 1) : undefined
    };
  }

  onSelectVersion = ({ rev }: Cotype.VersionItem) => {
    this.setState({ activeVersion: rev });
    if (this.props.onSelect) {
      this.props.onSelect(String(rev));
    }
  };

  render() {
    const { model, versions, id, onUnpublish } = this.props;
    const { activeVersion } = this.state;

    if (!activeVersion) return null;

    return (
      <SplitPane width={300} primary="right">
        <VersionList
          model={model}
          versions={versions}
          activeVersion={activeVersion}
          onSelectVersion={this.onSelectVersion}
          onUnpublish={onUnpublish}
        />
        <History
          id={id}
          rev={activeVersion}
          model={model}
          versions={versions}
        />
      </SplitPane>
    );
  }
}
