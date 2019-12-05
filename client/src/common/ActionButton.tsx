import React, { Component } from "react";
import styled from "styled-components/macro";
import PopoverMenu, { Menu, Item } from "./PopoverMenu";
import Icon from "./icons";
import { testable } from "../utils/helper";

type P = {
  disabled?: boolean;
};

const Button = styled("div")`
  display: inline-block;
  border-radius: 3px;
  position: relative;
  background-color: ${(p: P) =>
    p.disabled ? "var(--disabled-color)" : "var(--accent-color)"};
`;

const ButtonFace = styled("div")`
  border-radius: 3px;
  box-sizing: border-box;
  color: #fff;
  cursor: pointer;
  font-family: inherit;
  font-size: 1.1em;
  font-weight: 500;
  line-height: inherit;
  padding: 0.8em 1em;
  display: inline-flex;
  text-transform: uppercase;
  white-space: nowrap;
  background-color: ${(p: P) =>
    p.disabled ? "var(--disabled-color)" : "transparent"};
  :hover {
    background-color: ${(p: P) =>
      p.disabled ? "var(--disabled-color)" : "hsla(0, 0%, 100%, 0.1)"};
  }
`;

const Label = styled("div")`
  flex: 1;
  margin-right: 1em;
`;

const styles = {
  item: {
    cursor: "pointer"
  }
};

type Action = {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
};

type Props = {
  label: string;
  disabled?: boolean;
  actions: Action[];
};
export default class ActionButton extends Component<Props> {
  renderMenu = (close: () => void) => {
    const { disabled, actions } = this.props;
    if (disabled) return null;
    return (
      <Menu>
        {actions.filter(a => !a.disabled).map(a => (
          <Item
            {...testable("action-item")}
            style={styles.item}
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
    const { label, disabled, actions, ...rest } = this.props;
    return (
      <span>
        <PopoverMenu renderMenu={this.renderMenu}>
          <Button disabled={disabled}>
            <ButtonFace disabled={disabled} {...rest}>
              <Label>{label}</Label>
              <Icon.Down />
            </ButtonFace>
          </Button>
        </PopoverMenu>
      </span>
    );
  }
}
