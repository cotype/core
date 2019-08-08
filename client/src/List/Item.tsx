import React, { Component } from "react";
import { NavLink } from "react-router-dom";
import styled, { css } from "styled-components/macro";
import ImageCircle from "../common/ImageCircle";
import { testable } from "../utils/helper";

const activeClass = css`
  background-color: var(--accent-color) !important;
  color: #fff;
`;

const StyledNavLink = styled(NavLink)`
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
  &.active {
    width: 100%;
    ${activeClass}
  }
`;

const Title = styled("span")`
  display: block;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export type ItemProps = {
  index: number;
  id: string;
  title: string;
  image?: string | null | undefined;
  style?: object;
  className?: string;
  small?: boolean;
  baseUrl: string;
};

export default class Item extends Component<ItemProps> {
  render() {
    const { id, title, image, style, baseUrl, className, small } = this.props;
    const src =
      image && (image.includes("://") ? image : `/thumbs/square/${image}`);
    return (
      <StyledNavLink
        to={`${baseUrl}/edit/${id}`}
        {...testable("list-item")}
        style={style}
        className={className}
      >
        <ImageCircle
          src={src ? src : null}
          alt={title}
          size={small ? 12 : 24}
        />
        <Title>{title}</Title>
      </StyledNavLink>
    );
  }
}
