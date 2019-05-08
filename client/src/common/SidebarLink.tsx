import React from "react";
import { NavLink, NavLinkProps } from "react-router-dom";
import { css } from "react-emotion";

const link = css`
  display: block;
  color: inherit;
  text-decoration: none;
  padding: 12px 18px;
`;

const active = css`
  background-color: var(--primary-color);
  color: white !important;
`;

export default function SidebarLink(props: NavLinkProps) {
  return <NavLink className={link} activeClassName={active} {...props} />;
}
