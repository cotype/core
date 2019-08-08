import React, { Component } from "react";
import styled, { css } from "styled-components/macro";
import Icon from "../common/icons";
import { testable } from "../utils/helper";

type P = {
  onClick?: (ev: any) => void;
  disabled?: boolean;
};
const Tile = styled("div")`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 150px;
  height: 150px;
  background: #eee
    url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4" fill-opacity=".05" ><rect x="2" width="2" height="2" /><rect y="2" width="2" height="2" /></svg>');
  background-size: 20px 20px;
  box-shadow: 0 2px 3px rgba(0, 0, 0, 0.3);
  ${(p: P) =>
    p.onClick &&
    css`
      cursor: pointer;
    `};
  ${(p: P) =>
    p.disabled &&
    css`
      opacity: 0.2;
      cursor: not-allowed;
    `};
`;

const Caption = styled("div")`
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  padding: 3px 8px;
  background-color: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 11px;
  overflow-wrap: break-word;
`;

const ItemActions = styled("div")`
  position: absolute;
  z-index: 1;
  opacity: 0;
  transition: opacity 0.2s;
  div:hover > & {
    opacity: 1;
  }
`;

const Action = styled("div")`
  background-color: #fff;
  height: 30px;
  width: 30px;
  border-radius: 15px;
  color: #000;
  display: block;
  margin: 0 auto;
  display: inline-block;
  position: relative;
  margin: 4px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.6);
  cursor: pointer;
  svg {
    width: 100%;
    height: 100%;
    padding: 4px;
    box-sizing: border-box;
    path: {
      fill: inherit;
    }
  }
`;

const Doc = styled("div")`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 10px;
  text-transform: uppercase;
`;

type Props = {
  id: string;
  originalname: string;
  width: number | "auto" | null;
  height: number | "auto" | null;
  editable?: boolean;
  disabled?: boolean;
  onSelect?: (ev: any) => void;
  onDelete?: (ev: any) => void;
  style?: any;
};

export default class Image extends Component<Props> {
  render() {
    const {
      style,
      onSelect,
      originalname,
      width,
      editable,
      onDelete,
      disabled
    } = this.props;

    return (
      <div>
        <Tile
          style={style}
          onClick={!editable && !disabled ? onSelect : undefined}
          disabled={disabled}
          {...testable("media-tile")}
        >
          {!disabled && editable && (
            <ItemActions {...testable("media-tile-actions")}>
              {onSelect && (
                <Action onClick={onSelect} {...testable("media-details")}>
                  <Icon.Details />
                </Action>
              )}
              {onDelete && (
                <Action
                  onClick={onDelete}
                  style={{ backgroundColor: "#ff5e49", color: "#fff" }}
                  {...testable("media-delete")}
                >
                  <Icon.Trash />
                </Action>
              )}
            </ItemActions>
          )}
          {width ? this.renderImage() : this.renderIcon()}
          <Caption {...testable("media-caption")}>{originalname}</Caption>
        </Tile>
      </div>
    );
  }

  renderImage() {
    const { id } = this.props;
    return (
      <img
        style={{ objectFit: "contain" }}
        src={id.includes("://") ? id : `/thumbs/square/${id}`}
        alt={""}
        width="150"
        height="150"
        {...testable("media-preview")}
      />
    );
  }

  renderIcon() {
    const { originalname } = this.props;
    const ext = originalname && originalname.replace(/.*\./, "");
    return (
      <Doc>
        <Icon.Document width={48} height={48} {...testable("media-preview")} />
        {ext}
      </Doc>
    );
  }
}
