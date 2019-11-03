import { VersionItem } from "../../../typings";
import React, { Component } from "react";
import styled from "styled-components/macro";

import ModalDialog from "../common/ModalDialog";
import ResultItem from "../common/ResultItem";

const defaultValues = {
  publish: {
    title: "Unpublished or timed references",
    description:
      "The content you're trying to publish contains references to other unpublished or timed content. Please publish or untime following content: "
  },
  schedule: {
    title: "Content in use",
    description:
      "The content you're trying to schedule is required by other content. Please remove all references to this content from following contents in order to proceed the scheduling: "
  },
  unpublish: {
    title: "Content in use",
    description:
      "The content you're trying to unpublish is referenced to by other content. Please remove all references to this content in following content:"
  },
  delete: {
    title: "Content in use",
    description:
      "The content you're trying to delete is still in use. Please remove or replace references in following content first:"
  },
  media: {
    title: "File in use",
    description:
      "The file you're trying to delete is still in use. Please remove or replace the file in following locations:"
  }
};
const List = styled("div")`
  max-height: 50vw;
  overflow: scroll;
  margin-top: 24px;
`;
const Item = styled("div")`
  display: flex;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
  padding: 10px;
  cursor: pointer;
  border-radius: 3px;
  :hover {
    background-color: var(--light-color);
  }
`;

export type ConflictTypes =
  | "publish"
  | "unpublish"
  | "delete"
  | "media"
  | "schedule";
type Props = {
  onClose: () => void;
  items: VersionItem[];
  title?: string;
  description?: string;
  type: ConflictTypes;
};

export default class ConflictDialog extends Component<Props> {
  render() {
    const { onClose, items, title, description, type } = this.props;

    return (
      <ModalDialog
        title={title || (defaultValues[type] && defaultValues[type].title)}
        onClose={onClose}
      >
        <div>
          {description ||
            (defaultValues[type] && defaultValues[type].description)}
        </div>
        <List>
          {items.map(item => (
            <Item key={item.id} onClick={onClose}>
              <ResultItem item={item} />
            </Item>
          ))}
        </List>
      </ModalDialog>
    );
  }
}
