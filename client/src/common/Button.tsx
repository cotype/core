import React from "react";
import styled, { css } from "react-emotion";
import Icon from "./Icon";

type P = {
  light?: boolean;
  secondary?: boolean;
};
export const StyledButton = styled("button")`
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  text-align: center;
  padding: 0.7em 1em;
  height: 42px;
  outline: none;
  border: none;
  border-radius: 3px;
  text-transform: uppercase;
  color: white;
  background: var(--primary-color);
  white-space: nowrap;
  font-weight: 500;
  font-size: 0.8em;
  transition: all 0.3s cubic - bezier(0.55, 0, 0.1, 1);
  :hover {
    background-color: var(--primary-color--dark);
  }
  & > span:not(:empty) {
    margin-left: 0.4em;
  }
  ${(p: P) =>
    p.secondary &&
    css`
      background-color: var(--light-grey);
      color: var(--dark-grey);
      &:hover {
        background-color: var(--dark-grey);
        color: white;
      }
    `}
`;

type Props = {
  icon?: string;
  children?: any;
  light?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export default function Button({ icon, children, ...props }: Props) {
  return (
    <StyledButton type="button" {...props}>
      {icon && <Icon path={icon} />}
      <span>{children && children}</span>
    </StyledButton>
  );
}
