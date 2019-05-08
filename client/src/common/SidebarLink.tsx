import React from "react";
import { NavLink, NavLinkProps } from "react-router-dom";
import { css } from "react-emotion";

const active = css`
  background-color: hsla(0, 0%, 100%, 0.1);
`;

const link = css`
  display: block;
  color: #e8e8e8;
  text-decoration: none;
  padding: 12px 18px;
  :hover {
    ${active};
  }
`;

export default function SidebarLink(props: NavLinkProps) {
  return <NavLink className={link} activeClassName={active} {...props} />;
}
