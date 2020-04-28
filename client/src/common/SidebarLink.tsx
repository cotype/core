import React from "react";
import { NavLink, NavLinkProps } from "react-router-dom";
import styled, { css } from "styled-components/macro";

const active = css`
  background-color: hsla(0, 0%, 100%, 0.1);
`;

const StyledNavLink = styled(NavLink)<NavLinkProps>`
  display: block;
  color: #e8e8e8;
  text-decoration: none;
  padding: 12px 18px;
  :hover {
    ${active};
  }
  &.active {
    ${active};
  }
`;

export default function SidebarLink(props: NavLinkProps) {
  return <StyledNavLink {...props} />;
}
