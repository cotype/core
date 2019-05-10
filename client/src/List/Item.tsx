import React, { Component } from "react";
import { NavLink } from "react-router-dom";
import { css } from "react-emotion";
import ImageCircle from "../common/ImageCircle";
import { testable } from "../utils/helper";

const itemClass = css`
  display: flex;
  width: 100%;
  position: relative;
  background: #fff;
  text-decoration: none;
  color: inherit;
  border-bottom: 1px solid #f5f5f5;
  padding: 10px 15px 10px 23px;
  box-sizing: border-box;
  align-items: center;
  :hover {
    background-color: var(--primary-color);
    color: #fff;
  }
`;

const activeClass = css`
  background-color: var(--accent-color) !important;
  color: #fff;
`;

export type ItemProps = {
  index: number;
  id: string;
  title: string;
  image?: string | null | undefined;
  style?: object;
  className?: object;
  small?: boolean;
  baseUrl: string;
};

export default class Item extends Component<ItemProps> {
  render() {
    const { id, title, image, style, baseUrl, className, small } = this.props;
    const src =
      image && (image.includes("://") ? image : `/thumbs/square/${image}`);
    return (
      <NavLink
        to={`${baseUrl}/edit/${id}`}
        {...testable("list-item")}
        style={style}
        className={itemClass + " " + className}
        activeClassName={activeClass}
      >
        <ImageCircle
          src={src ? src : null}
          alt={title}
          size={small ? 12 : 24}
        />
        {title}
      </NavLink>
    );
  }
}
