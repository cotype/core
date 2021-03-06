import * as Cotype from "../../../../typings";
import React, { Component } from "react";
import styled from "styled-components/macro";
import TimeAgo from "react-time-ago";
import { formatBytes, testable } from "../../utils/helper";
import ModalDialog from "../../common/ModalDialog";
import { Cols, Content, Outset } from "../../common/page";
import FocusPoint from "./FocusPoint";
import Button from "../../common/Button";
import { paths } from "../../common/icons";
import ChipList from "../../common/ChipList";
import api from "../../api";
import { mediaBasePath } from "../../basePath";
import { Input } from "../../common/styles";

const MetaInput = styled("div")`
  margin-bottom: 10px;
`;
const MetaData = styled("div")`
  background-color: #f5f5f5;
  border-radius: 4px;
  padding: 24px;
  padding: 1.5rem;
`;
const Grid = styled("div")`
  list-style: none;
  margin-right: 0;
  margin-left: -24px;
  padding-left: 0;
  padding-right: 0;
  letter-spacing: -1000em;
  display: flex;
  flex-wrap: wrap;
`;
const FlexRow = styled("div")`
  display: flex;
  width: 100%;
`;
const Meta = styled("div")`
  display: inline-block;
  padding-left: 24px;
  vertical-align: top;
  box-sizing: border-box;
  letter-spacing: 0;
  width: 100%;
  margin-bottom: 1.5rem;
`;
const MetaItemLabel = styled("div")`
  text-transform: uppercase;
  color: #848484;
  font-weight: 500;
  font-size: 14px;
  font-size: 0.875rem;
  margin-bottom: 0.5em;
`;
const MetaItemValue = styled("div")`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const MetaItem = ({
  label,
  value,
  noMargin
}: {
  label: string;
  value: string | React.ReactNode;
  noMargin?: boolean;
}) => {
  return (
    <Meta style={noMargin ? { marginBottom: 0 } : {}}>
      <MetaItemLabel>{label}</MetaItemLabel>
      <MetaItemValue>{value}</MetaItemValue>
    </Meta>
  );
};

const modalStyle = {
  width: "90vw",
  maxWidth: 1200,
  height: "80vmin",
  maxHeight: 800
};

type Props = {
  onClose: () => void;
  fetchMediaItem: (media: Cotype.Media) => void;
  data: Cotype.Media[];
};

type State = {
  x: number | null;
  y: number | null;
  tags: string[];
  alt: string | null;
  credit: string | null;
  originalname: string | null;
};
export default class Details extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    const [
      { focusX, focusY, tags, credit, alt, originalname }
    ] = this.props.data;
    const n = originalname.split(".");
    n.pop();
    const nameWithoutExt = n.join(".");
    this.state = {
      x: focusX,
      y: focusY,
      tags: tags ? tags : [],
      alt,
      credit,
      originalname: nameWithoutExt
    };
  }

  onFocusChange = (x: number, y: number) => {
    this.setState({ x, y });
  };

  onSave = () => {
    const { x, y, tags, credit, alt, originalname } = this.state;
    const [media] = this.props.data;
    const n = this.props.data[0].originalname.split(".");
    const ext = n.pop();
    api
      .updateMedia(media.id, {
        focusX: x,
        focusY: y,
        tags,
        credit,
        alt,
        originalname: originalname + "." + ext
      })
      .then(() => {
        this.props.fetchMediaItem(media);
      });

    this.props.onClose();
  };

  onAddTag = (tag: string) => {
    const { tags } = this.state;
    tags.push(tag);
    this.setState({ tags });
  };

  onDeleteTag = (index: number) => {
    const { tags } = this.state;
    tags.splice(index, 1);
    this.setState({ tags });
  };
  render() {
    const { onClose, data } = this.props;

    const { x, y, tags, credit, alt, originalname } = this.state;
    if (!data) return null;

    const [media] = this.props.data;

    const {
      imagetype,
      created_at,
      size,
      width,
      height,
      focusX,
      focusY,
      id
    } = media;

    const actions = [
      <Button icon={paths.Save} onClick={this.onSave}>
        Save
      </Button>,
      <Button icon={paths.Clear} onClick={onClose} light>
        Cancel
      </Button>
    ];

    const hasPreview = !!["png", "jpg", "svg"].find(t => t === imagetype);

    return (
      <ModalDialog
        onClose={onClose}
        title="Details"
        actionButtons={actions}
        style={modalStyle}
        bodyStyle={{ padding: 0 }}
      >
        <Cols style={{ height: "100%" }}>
          {hasPreview && (
            <Content>
              <FocusPoint
                data={media}
                onPosistionChange={this.onFocusChange}
                initialX={x ? x : focusX ? focusX : undefined}
                initialY={y ? y : focusY ? focusY : undefined}
              />
            </Content>
          )}
          <Content style={{ overflowY: "scroll" }}>
            <Outset style={!hasPreview ? { marginLeft: 0 } : undefined}>
              <MetaData>
                <MetaInput>
                  <MetaItemLabel>Alt</MetaItemLabel>
                  <Input
                    {...testable("meta-data-alt")}
                    value={alt || ""}
                    onChange={e => this.setState({ alt: e.target.value })}
                  />
                </MetaInput>
                <MetaInput>
                  <MetaItemLabel>File Name</MetaItemLabel>
                  <Input
                    {...testable("meta-data-originalname")}
                    value={originalname || ""}
                    onChange={e =>
                      this.setState({ originalname: e.target.value })
                    }
                  />
                </MetaInput>
                <MetaInput>
                  <MetaItemLabel>Credit</MetaItemLabel>
                  <Input
                    value={credit || ""}
                    onChange={e => this.setState({ credit: e.target.value })}
                  />
                </MetaInput>
                <MetaInput>
                  <MetaItemLabel>URL</MetaItemLabel>
                  <FlexRow>
                    <Input
                      value={
                        window.location.origin + mediaBasePath + "/media/" + id
                      }
                      readOnly
                    />
                    <Button
                      icon={paths.OpenInTab}
                      light
                      href={mediaBasePath + "/media/" + id}
                      target="_blank"
                      asLink
                      title="open in new tab"
                    >
                      open
                    </Button>
                  </FlexRow>
                </MetaInput>
                <MetaItemLabel>Tags</MetaItemLabel>
                <ChipList
                  onAdd={this.onAddTag}
                  onDelete={this.onDeleteTag}
                  values={tags}
                />
              </MetaData>
              <MetaData style={{ marginTop: "1em" }}>
                <Grid>
                  <MetaItem label="File type" value={imagetype} />
                  <MetaItem label="File size" value={formatBytes(size)} />
                  <MetaItem
                    label="Upload date"
                    value={<TimeAgo date={new Date(created_at)} />}
                  />
                  {width && (
                    <MetaItem
                      label="Dimensions"
                      value={`${width}x${height}px`}
                      noMargin
                    />
                  )}
                </Grid>
              </MetaData>
            </Outset>
          </Content>
        </Cols>
      </ModalDialog>
    );
  }
}
