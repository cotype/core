import * as Cotype from "../../../../typings";
import React, { Component } from "react";
import styled from "react-emotion";
import { TimeAgo } from "react-time-ago";
import { formatBytes } from "../../utils/helper";
import ModalDialog from "../../common/ModalDialog";
import { Cols, Content, Outset } from "../../common/page";
import FocusPoint from "./FocusPoint";
import Button from "../../common/Button";
import { paths } from "../../common/icons";
import ChipList from "../../common/ChipList";
import api from "../../api";

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
  x?: number | null;
  y?: number | null;
  tags: string[];
};
export default class Details extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    const [{ focusX, focusY, tags }] = this.props.data;

    this.state = {
      x: focusX,
      y: focusY,
      tags: tags ? tags : []
    };
  }

  onFocusChange = (x: number, y: number) => {
    this.setState({ x, y });
  };

  onSave = () => {
    const { x, y, tags } = this.state;
    const [media] = this.props.data;

    api
      .updateMedia(media.id, {
        focusX: x,
        focusY: y,
        tags
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

    const { x, y, tags } = this.state;
    if (!data) return null;

    const [media] = this.props.data;

    const {
      originalname,
      imagetype,
      created_at,
      size,
      width,
      height,
      focusX,
      focusY
    } = media;

    const actions = [
      <Button icon={paths.Save} onClick={this.onSave}>
        Übernehmen
      </Button>,
      <Button icon={paths.Clear} onClick={onClose} light>
        Abbrechen
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
                <Grid>
                  <MetaItem label="File name" value={originalname} />
                  <MetaItem label="File type" value={imagetype} />
                  <MetaItem label="File size" value={formatBytes(size)} />
                  <MetaItem
                    label="Upload date"
                    value={<TimeAgo>{new Date(created_at)}</TimeAgo>}
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
              <MetaData style={{ marginTop: "1em" }}>
                <MetaItemLabel>Tags</MetaItemLabel>
                <ChipList
                  onAdd={this.onAddTag}
                  onDelete={this.onDeleteTag}
                  values={tags}
                />
              </MetaData>
            </Outset>
          </Content>
        </Cols>
      </ModalDialog>
    );
  }
}
