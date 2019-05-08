import * as Cotype from "../../../../typings";
import React, { Component } from "react";
import Sidebar from "../ActionBar";
import History from "./History";
import HistoryChooser from "./HistoryChooser";
import ModalDialog from "../../common/ModalDialog";
import { getPreviewUrl } from "../../utils/helper";
import { withModelPaths } from "../../ModelPathsContext";

const historyStyle = {
  width: "80vw",
  height: "90vh",
  background: "#f5f5f5",
  maxWidth: 1600
};

type Props = {
  id: string;
  model: Cotype.Model;
  versions?: Array<Cotype.VersionItem & { published: boolean }>;
  onPublish?: () => void;
  onUnpublish: () => void;
  modelPaths: Cotype.ModelPaths;
  baseUrls: Cotype.BaseUrls;
};

type State = {
  historyOpen: boolean;
  formData: any;
};
class ReadOnly extends Component<Props> {
  state: State = {
    historyOpen: false,
    formData: null
  };

  onPreview = (modelPreviewUrl?: string) => {
    const { formData } = this.state;
    const { baseUrls } = this.props;
    if (!formData || !modelPreviewUrl) return;

    const previewUrl = getPreviewUrl(
      formData.data,
      `${baseUrls.preview ? baseUrls.preview : ""}${modelPreviewUrl}`
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
          onPreview={() => this.onPreview(model.urlPath)}
        />
        <History
          onReceiveData={data => this.setState({ formData: data })}
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
