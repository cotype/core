import { Media as MediaType, UnionType } from "../../../../typings";
import React, { Component } from "react";
import styled, { css } from "react-emotion";
import { FieldProps } from "formik";
import api from "../../api";
import Media from "../../Media";
import Image from "../../Media/Image";
import Button, { StyledButton } from "../../common/Button";
import ModalDialog from "../../common/ModalDialog";
import ProgressCircle from "../../common/ProgressCircle";
import { inputClass } from "../../common/styles";
import UploadZone from "../../Media/UploadZone";
import UploadField from "../../Media/UploadField";
import { required } from "./validation";
import { sizeFormat } from "../../utils/formatters";
import { testable } from "../../utils/helper";

const Root = styled("div")`
  display: flex;
  flex: 1;
  align-items: center;
`;

const Chooser = styled("div")`
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin: 20px;
  min-height: 110px;
`;

const Buttons = styled("div")`
  margin-top: 10px;
  display: flex;
  align-items: center;
`;

const Dialog = styled("div")`
  height: calc(100vh - 250px);
  width: calc(100vw - 220px);
`;

const EmptyTile = styled("div")`
  width: 150px;
  height: 150px;
  border: 1px dashed var(--dark-grey);
`;

const activeClass = css`
  border-color: var(--accent-color);
  outline: 1px solid var(--accent-color);
`;

const modalDialogStyle = {
  width: "80vw",
  height: "90vh",
  background: "#f5f5f5",
  maxWidth: 1600
};

function MediaImage({ media, onDelete }) {
  if (typeof media === "string") {
    return (
      <Image
        id={media}
        originalname={media.split("/").splice(-1)[0]}
        width={150}
        height={150}
        onDelete={onDelete}
        editable
      />
    );
  }
  return <Image {...media} onDelete={onDelete} editable />;
}

const UploadButton = StyledButton.withComponent("label");

type Props = FieldProps<any> & {
  withExternal?: boolean;
  mediaType?: string;
  mimeType?: string;
  maxSize?: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
};
type State = {
  media?: MediaType | string;
  open?: boolean;
  externalRefOpen?: boolean;
  externalRefVal?: string;
};
export default class MediaInput extends Component<Props, State> {
  static validate(value, props) {
    const isRequired = required(value, props);
    if (isRequired) return isRequired;
  }

  static getHint(model) {
    const { minHeight, minWidth, maxHeight, maxWidth, maxSize } = model;
    const str: string[] = [];

    if (minHeight) {
      str.push("Min Höhe: " + minHeight + "px");
    }
    if (minWidth) {
      str.push("Min Breite: " + minWidth + "px");
    }
    if (maxHeight) {
      str.push("Max Höhe: " + maxHeight + "px");
    }
    if (maxWidth) {
      str.push("Max Breite: " + maxWidth + "px");
    }
    if (maxSize) {
      str.push("Max Größe: " + sizeFormat(maxSize, 2));
    }
    if (str.length > 0) {
      return `(${str.join(", ")})`;
    } else {
      return "";
    }
  }

  static itemFactory(type: UnionType, cb: (arg: any) => void) {
    return () => (
      <ModalDialog
        onClose={() => cb(null)}
        title="Gallery"
        style={modalDialogStyle}
      >
        <Media openFromInput onSelect={([media]) => cb(media.id)} />
      </ModalDialog>
    );
  }

  state: State = {};

  componentDidMount() {
    this.fetchMedia();
  }

  componentDidUpdate(prevProps: Props) {
    const id = this.props.field.value;

    if (id !== prevProps.field.value) this.fetchMedia();
  }

  fetchMedia() {
    const id = this.props.field.value;

    if (this.props.withExternal && id && id.match(/^http/)) {
      this.setState({ media: id, externalRefVal: id });
      return;
    }

    if (id) {
      api.loadMedia(id).then(media => {
        if (this.props.field.value) {
          this.setState({ media });
        }
      });
    } else {
      this.setState({ media: undefined });
    }
  }

  openGallery = () => {
    this.setState({ open: true });
  };

  closeGallery = () => {
    this.setState({ open: false });
  };

  chooseMedia = ([media]: MediaType[] | string[]) => {
    this.closeGallery();
    this.setState({ media });
    this.props.form.setFieldValue(
      this.props.field.name,
      media ? (typeof media === "string" ? media : media.id) : null
    );
  };

  onUpload = (res: {
    files: MediaType[] | string[];
    duplicates: MediaType[];
  }) => {
    this.chooseMedia(res.files);
  };

  externalRefDialog = () => {
    this.setState({ externalRefOpen: true });
  };

  closeExternalRefDialog = () => {
    this.setState({
      externalRefOpen: false,
      externalRefVal:
        typeof this.state.media === "string" ? this.state.media : ""
    });
  };

  closeAndSaveExternalRefDialog = () => {
    this.setState({
      externalRefOpen: false
    });

    this.chooseMedia([this.state.externalRefVal || ""]);
  };

  setExternalRef = (event: { target: { value: string } }) => {
    this.setState({ externalRefVal: event.target.value });
  };

  onDelete = () => {
    this.props.form.setFieldValue(this.props.field.name, null);
  };

  render() {
    const { media, open, externalRefOpen } = this.state;
    const {
      mediaType,
      mimeType,
      maxSize,
      minWidth,
      minHeight,
      maxWidth,
      maxHeight
    } = this.props;

    return (
      <UploadZone
        multiple={false}
        className={inputClass}
        activeClass={activeClass}
        onUpload={this.onUpload}
        mediaType={mediaType}
        mediaFilter={{
          mimeType,
          maxSize,
          minWidth,
          minHeight,
          maxWidth,
          maxHeight
        }}
        render={({ progress, complete, onFiles }: any) => (
          <Root {...testable("upload-zone")}>
            {progress && !complete ? (
              <ProgressCircle size={150} percentage={progress} />
            ) : media ? (
              <MediaImage media={media} onDelete={this.onDelete} />
            ) : (
              <EmptyTile />
            )}
            <Chooser>
              Drag an image here
              <Buttons>
                <UploadButton light>
                  <UploadField onFiles={onFiles}>Browse computer</UploadField>
                </UploadButton>
                <Button light onClick={this.openGallery}>
                  Open gallery
                </Button>
                {this.props.withExternal && (
                  <Button light onClick={this.externalRefDialog}>
                    External Reference
                  </Button>
                )}
              </Buttons>
            </Chooser>
            {open && (
              <ModalDialog
                onClose={this.closeGallery}
                title="Gallery"
                style={modalDialogStyle}
              >
                <Media
                  openFromInput
                  onSelect={this.chooseMedia}
                  mediaType={mediaType}
                  mediaFilter={{
                    mimeType,
                    maxSize,
                    minWidth,
                    minHeight,
                    maxWidth,
                    maxHeight
                  }}
                />
              </ModalDialog>
            )}
            {externalRefOpen && (
              <ModalDialog
                onClose={this.closeExternalRefDialog}
                title="External Media Reference"
                style={modalDialogStyle}
              >
                <input
                  className={inputClass}
                  value={this.state.externalRefVal || ""}
                  onChange={this.setExternalRef}
                />
                <Buttons>
                  <Button light onClick={this.closeExternalRefDialog}>
                    Cancel
                  </Button>
                  <Button onClick={this.closeAndSaveExternalRefDialog}>
                    OK
                  </Button>
                </Buttons>
              </ModalDialog>
            )}
          </Root>
        )}
      />
    );
  }
}
