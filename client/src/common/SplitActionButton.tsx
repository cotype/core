import React from "react";
import styled from "react-emotion";
import PopoverMenu, { Menu, Item } from "./PopoverMenu";
import Icon from "./icons";

type P = {
  disabled?: boolean;
};

export const Outer = styled("div")`
  margin-top: 10px;
  color: #34363a;
  border-radius: 3px;
  box-sizing: border-box;
  border-width: 0;
  width: 100%;
  display: flex;
  background-color: ${(p: P) =>
    p.disabled ? "var(--disabled-color)" : "var(--accent-color)"};
  position: relative;
`;

export const Button = styled("button")`
  border-width: 0;
  border-radius: 3px 0 0 3px;
  font-size: 1.1em;
  text-transform: uppercase;
  cursor: pointer;
  padding: 0.8em 1em;
  font-family: inherit;
  line-height: inherit;
  white-space: nowrap;
  flex: 1;
  border: 0;
  color: #fff;
  background-color: ${(p: P) =>
    p.disabled ? "var(--disabled-color)" : "transparent"};
  font-weight: 500;
  outline: none;
  :hover {
    background-color: ${(p: P) =>
      p.disabled ? "var(--disabled-color)" : "hsla(0, 0%, 100%, 0.1)"};
  }
`;

const Extra = styled("div")`
  border: 0;
  border-left: 1px solid hsla(0, 0%, 100%, 0.3);
  padding: 0.8em 1em;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.55, 0, 0.1, 1);
  background-color: transparent;
  color: #fff;
  :hover {
    background-color: hsla(0, 0%, 100%, 0.1);
  }
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

const renderMenu = (close: () => void, pending: any, actions: Action[]) =>
  !pending && (
    <Menu>
      {actions.filter(a => !a.disabled).map(a => (
        <Item
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

type Props = Action & {
  pending?: boolean;
  actions: Action[];
};

export default function ActionButton({
  label,
  onClick,
  disabled,
  pending,
  actions
}: Props) {
  return (
    <Outer disabled={pending}>
      <Button
        type={onClick ? "button" : "submit"}
        onClick={onClick && !pending ? () => onClick() : undefined}
        disabled={disabled}
      >
        {label}
      </Button>
      {actions && (
        <PopoverMenu
          renderMenu={(close: () => void) =>
            renderMenu(close, pending, actions)
          }
        >
          <Extra>
            <Icon.Down />
          </Extra>
        </PopoverMenu>
      )}
    </Outer>
  );
}
