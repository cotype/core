import * as Cotype from "../../../../typings";
import React, { Component } from "react";
import HistoryChooser from "./HistoryChooser";
import ModalDialog from "../../common/ModalDialog";
import Button from "../../common/Button";
import { paths } from "../../common/icons";

const historyStyle = {
  width: "80vw",
  height: "90vh",
  background: "#f5f5f5",
  maxWidth: 1600
};

type Props = {
  id: string;
  rev?: string;
  model: Cotype.Model;
  versions?: (Cotype.VersionItem & { published: boolean })[];
  onClose: () => void;
  onUnpublish: () => void;
  onRestore: (rev: string) => void;
};

type State = {
  rev: string | null;
};

export default class HistoryModal extends Component<Props, State> {
  onSelect = (rev: string) => {
    this.setState({ rev });
  };

  onRestore = () => {
    const { rev } = this.state;
    if (rev) this.props.onRestore(rev);
    else this.props.onClose();
  };

  render() {
    const { model, id, versions, onClose, onUnpublish } = this.props;

    if (!id || !versions || versions.length < 2) return null;

    const actionButtons = [
      <Button icon={paths.History} onClick={this.onRestore}>
        Restore
      </Button>
    ];

    return (
      <ModalDialog
        title={"History"}
        onClose={onClose}
        style={historyStyle}
        bodyStyle={{ padding: 0 }}
        actionButtons={actionButtons}
      >
        <HistoryChooser
          id={id}
          model={model}
          versions={versions}
          onSelect={this.onSelect}
          onUnpublish={onUnpublish}
        />
      </ModalDialog>
    );
  }
}
