import React, { Component } from "react";
import { Button, paths, ToggleSwitch } from "@cotype/ui";
import ModalDialog from "../common/ModalDialog";
import * as Cotype from "../../../typings";
import { Language } from "../../../typings";
import styled from "styled-components/macro";

const Row = styled("div")`
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 1em;
`;
const Label = styled("span")`
  font-weight: bold;
  margin-left: 1em;
`;

type Props = {
  onSave: (languages: Language[]) => void;
  onClose: () => void;
  model: Cotype.Model;
  activeLanguages: Language[];
  languages: Language[];
};

class LanguageModal extends Component<Props, { activeLanguages: Language[] }> {
  state = {
    activeLanguages: this.props.activeLanguages
  };
  save = () => {
    if (this.state.activeLanguages.length < 1) {
      return alert("At least one language");
    }
    this.props.onSave(this.state.activeLanguages);
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
        {this.props.languages.map(lang => {
          const isActive = !!this.state.activeLanguages?.find(
            l => l.key === lang.key
          );
          return (
            <Row>
              <ToggleSwitch
                on={isActive}
                onClick={() =>
                  this.setState(s =>
                    s.activeLanguages.find(l => l.key === lang.key)
                      ? {
                          activeLanguages: s.activeLanguages.filter(
                            a => a.key !== lang.key
                          )
                        }
                      : {
                          activeLanguages: [...s.activeLanguages, lang]
                        }
                  )
                }
              />
              <Label>{lang.title}</Label>
            </Row>
          );
        })}
      </ModalDialog>
    );
  }
}

export default LanguageModal;
