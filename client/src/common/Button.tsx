import React from "react";
import styled from "react-emotion";
import Icon from "./Icon";

type P = {
  light?: boolean;
};
export const StyledButton = styled("button")`
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  padding: 0.7em 1em;
  outline: none;
  border: none;
  border-radius: 3px;
  background: ${({ light }: P) =>
    light ? "transparent" : "var(--primary-color)"};
  color: ${({ light }: P) => (light ? "var(--accent-color)" : "#fff")};
  text-transform: uppercase;
  white-space: nowrap;
  font-weight: 500;
  font-size: 0.8em;
  transition: all 0.3s cubic - bezier(0.55, 0, 0.1, 1);
  min-height: var(--input-min-height);
  :hover {
    background-color: ${({ light }: P) =>
      light ? "rgba(0, 0, 0, 0.05)" : "var(--accent-color)"};
  }
  & > span:not(:empty) {
    margin-left: 0.4em;
  }
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
