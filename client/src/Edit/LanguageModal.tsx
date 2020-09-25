import React, { Component } from "react";
import Button from "../common/Button";
import ModalDialog from "../common/ModalDialog";
import { paths } from "../common/icons";
import * as Cotype from "../../../typings";
import { Language } from "../../../typings";

type Props = {
  onSave: (languages: Language[]) => void;
  onClose: () => void;
  model: Cotype.Model;
  activeLanguages: Language[];
  languages: Language[];
};

const modalDialogStyle = {
  width: "80vw",
  background: "#f5f5f5",
  maxWidth: 800
};
class LanguageModal extends Component<Props, {}> {
  setPosition = (languages: Language[]) => {
    this.props.onSave(languages);
  };
  save = () => {
    this.props.onClose();
  };
  render() {
    const actions = [
      <Button icon={paths.Save} onClick={this.save}>
        save
      </Button>,
      <Button icon={paths.Clear} onClick={this.props.onClose} light>
        cancel
      </Button>
    ];
    return (
      <ModalDialog
        onClose={this.props.onClose}
        title="set languages"
        icon={paths.Translate}
        actionButtons={actions}
      >
        <div>hallo</div>
      </ModalDialog>
    );
  }
}

export default LanguageModal;
