import * as Cotype from "../../../../typings";
import React, { Component } from "react";
import Sidebar from "../ActionBar";
import History from "./History";
import HistoryChooser from "./HistoryChooser";
import ModalDialog from "../../common/ModalDialog";
import { getPreviewUrl } from "../../utils/helper";
import { withModelPaths } from "../../ModelPathsContext";
import { Language } from "../../../../typings";

const historyStyle = {
  width: "80vw",
  height: "90vh",
  background: "#f5f5f5",
  maxWidth: 1600
};

type Props = {
  id: string;
  model: Cotype.Model;
  versions?: (Cotype.VersionItem & { published: boolean })[];
  onPublish?: () => void;
  onUnpublish: () => void;
  modelPaths: Cotype.ModelPaths;
  baseUrls: Cotype.BaseUrls;
  languages: Cotype.Language[] | null;
};

type State = {
  historyOpen: boolean;
  formData: any;

  language: Cotype.Language | null;
  documentLanguages: Cotype.Language[] | null;
};
class ReadOnly extends Component<Props> {
  state: State = {
    historyOpen: false,
    formData: null,

    language: this.props.languages ? this.props.languages[0] : null,
    documentLanguages: this.props.languages ? this.props.languages : null
  };

  onPreview = (
    modelPreviewUrl?: string | { [s: string]: string },
    language?: Language | null
  ) => {
    const { formData } = this.state;
    const { baseUrls } = this.props;
    if (!formData || !modelPreviewUrl) return;

    const previewUrl = getPreviewUrl(
      formData.data,
      `${baseUrls.preview ? baseUrls.preview : ""}${
        typeof modelPreviewUrl === "string"
          ? modelPreviewUrl
          : modelPreviewUrl[
              language ? language.key : Object.keys(modelPreviewUrl)[0]
            ]
      }`,
      language
    );
    if (previewUrl) window.open(previewUrl);
  };

  get renderHistory() {
    const { historyOpen } = this.state;
    const { model, id, versions, onUnpublish } = this.props;

    if (!historyOpen || !id || !versions || versions.length < 2) return null;

    return (
      <ModalDialog
        title={"History"}
        onClose={() => {
          this.setState({ historyOpen: false });
        }}
        style={historyStyle}
        bodyStyle={{ padding: 0 }}
      >
        <HistoryChooser
          versions={versions}
          id={id}
          model={model}
          onUnpublish={onUnpublish}
        />
      </ModalDialog>
    );
  }

  setLanguage = (lang: Cotype.Language) => {
    this.setState({ language: lang });
  };

  render() {
    const { id, model, versions, onPublish } = this.props;
    return (
      <div>
        {this.renderHistory}
        <Sidebar
          model={model}
          versions={versions}
          onHistory={() => {
            this.setState({ historyOpen: true });
          }}
          hasSchedule={false}
          onPublishChange={onPublish}
          setLanguage={this.setLanguage}
          language={this.state.language}
          documentLanguages={this.state.documentLanguages}
          onPreview={() => this.onPreview(model.urlPath)}
        />
        <History
          onReceiveData={data =>
            this.setState({
              formData: data,
              documentLanguages: this.props.languages?.filter(l =>
                data.activeLanguages.includes(l)
              )
            })
          }
          versions={versions}
          id={id}
          rev={versions ? versions[0].rev : undefined}
          model={model}
        />
      </div>
    );
  }
}

export default withModelPaths(ReadOnly);
