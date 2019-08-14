import React from "react";
import styled from "styled-components/macro";
import Icon from "./icons";

export const StyledButton = styled("button")`
  cursor: ${({ disabled }: P) => !disabled && "pointer"};
  display: inline-flex;
  align-items: center;
  padding-left: 0;
  outline: none;
  border: none;
  border-radius: 3px;
  color: ${({ disabled }: P) =>
    disabled ? "var(--transparent-grey)" : "var(--dark-grey)"};
  text-transform: uppercase;
  white-space: nowrap;
  font-weight: 500;
  font-size: 0.8em;
  transition: all 0.3s cubic-bezier(0.55, 0, 0.1, 1);
  font-weight: bold;
  letter-spacing: 0.5px;
  background: none;
  :hover {
    color: ${({ disabled }: P) =>
      disabled ? "var(--transparent-grey)" : "var(--dark-color)"};
    & svg {
      color: ${({ disabled }: P) => !disabled && "white"};
    }
  }
`;

const PlusIcon = styled(Icon.Plus)`
  color: white;
  width: 100%;
  height: 100%;
  color: var(--slightly-transparent-white);
`;

type P = {
  disabled: boolean | undefined;
};
const IconWrapper = styled("div")`
  box-sizing: border-box;
  background: ${({ disabled }: P) =>
    disabled ? "var(--transparent-grey)" : "var(--primary-color)"};
  padding: 0.7em;
  border-radius: 4px;
  margin-right: 0.5em;
  width: var(--input-min-height);
  height: var(--input-min-height);
`;

type Props = {
  icon?: string;
  children: any;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export default function Button({ icon, children, disabled, ...props }: Props) {
  return (
    <StyledButton type="button" {...props} disabled={disabled}>
      <IconWrapper disabled={disabled}>
        <PlusIcon />
      </IconWrapper>
      {children}
    </StyledButton>
  );
}
