import { Principal, User, NavigationOpts } from "../../../typings";
import React, { Component } from "react";
import styled, { css } from "react-emotion";
import { NavLink, NavLinkProps } from "react-router-dom";
import basePath from "../basePath";
import { withUser } from "../auth/UserContext";
import Profile from "./Profile";
import Search from "../Search";
import { testable } from "../utils/helper";

const Bar = styled("div")`
  display: flex;
  background-color: var(--primary-color);
  color: #fff;
  height: 55px;
  justify-content: space-between;
`;

const itemClass = css`
  padding: 0 20px;
  display: flex;
  height: 100%;
  white-space: nowrap;
  align-items: center;
  border-right: 1px solid hsla(0, 0%, 100%, 0.1);
`;

const linkClass = css`
  ${itemClass} color: inherit;
  text-decoration: none;
  :hover {
    background-color: hsla(0, 0%, 100%, 0.1);
  }
`;

const activeClass = css`
  background-color: hsla(0, 0%, 100%, 0.1);
`;

const Item = styled("div")(itemClass);

const Items = styled("div")`
  display: flex;
  align-items: center;
`;

const ItemLink = (props: NavLinkProps) => (
  <NavLink className={linkClass} activeClassName={activeClass} {...props} />
);

type Props = {
  user: Principal & User;
  navigation: NavigationOpts[];
};

class Header extends Component<Props> {
  render() {
    const { user, navigation } = this.props;
    if (!user) return null;
    const { settings, content } = user.permissions;
    const hasContent = !!Object.keys(content).length;

    return (
      <Bar>
        <Items>
          {navigation.map(({ path, name }) => (
            <ItemLink
              {...testable("main-navigation-item")}
              key={path}
              to={`${basePath}${path}`}
            >
              {name}
            </ItemLink>
          ))}
          <ItemLink
            {...testable("main-navigation-item")}
            to={`${basePath}/media`}
          >
            Media
          </ItemLink>
          {settings && (
            <ItemLink
              {...testable("main-navigation-item")}
              to={`${basePath}/settings`}
            >
              Settings
            </ItemLink>
          )}
        </Items>
        <Items>
          <Item>
            <Search />
          </Item>
          <Item>
            <Profile />
          </Item>
        </Items>
      </Bar>
    );
  }
}

export default withUser(Header);
