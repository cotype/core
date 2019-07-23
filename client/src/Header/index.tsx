import { Principal, User, NavigationOpts } from "../../../typings";
import React, { Component } from "react";
import styled, { css } from "react-emotion";
import { NavLink, NavLinkProps } from "react-router-dom";
import basePath from "../basePath";
import { withUser } from "../auth/UserContext";
import Profile from "./Profile";
import Search from "./Search";
import { testable } from "../utils/helper";

export const HEIGHT = "55px";

const Bar = styled("div")`
  display: flex;
  background-color: #28292e;
  color: #fff;
  height: ${HEIGHT};
  justify-content: space-between;
`;

const itemClass = css`
  padding: 0 20px;
  display: flex;
  height: 100%;
  white-space: nowrap;
  align-items: center;
`;

const linkClass = css`
  ${itemClass} color: inherit;
  text-decoration: none;
  opacity: 0.7;
  transition: opacity 0.2s;
  :hover {
    opacity: 1;
  }
`;

const activeClass = css`
  font-weight: bold;
  opacity: 1;
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
    const { settings } = user.permissions;
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
