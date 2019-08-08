import React, { Component } from "react";
import styled from "styled-components/macro";
import Icon from "../common/icons";
import PopoverMenu, { Menu, Item } from "./PopoverMenu";

export const ItemAction = styled("button")`
  background: none;
  outline: none;
  border: none;
  margin: 0;
  padding: 0;
  padding-top: 7px;
  transition: all 0.3s cubic-bezier(0.55, 0, 0.1, 1);
  & svg {
    color: var(--dark-grey);
  }
  :hover {
    cursor: pointer;
  }
`;

type Action = {
  label: string;
  onClick: () => void;
  active?:boolean
};

type Props = {
  actions: Action[];
  icon?: React.ReactNode;
  buttonStyle?: object;
};
type State = {
  open: boolean;
};
export default class MoreButton extends Component<Props, State> {
  state = {
    open: false
  };

  onToggle = () => {
    this.setState(state => {
      return { open: !state.open };
    });
  };

  renderMenu = close => {
    const { actions } = this.props;
    return (
      <Menu>
        {actions.map(a => (
          <Item
            style={{ cursor: "pointer" }}
            active={a.active}
            key={a.label}
            onClick={() => {
              if (a.onClick) a.onClick();
              close();
            }}
          >
            {a.label}
          </Item>
        ))}
      </Menu>
    );
  };

  render() {
    const { icon, buttonStyle } = this.props;
    return (
      <PopoverMenu renderMenu={this.renderMenu}>
        <ItemAction type="button" onClick={this.onToggle} style={buttonStyle}>
          {icon || <Icon.More />}
        </ItemAction>
      </PopoverMenu>
    );
  }
}
