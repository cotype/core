import React from "react";
import styled, { css } from "react-emotion";
import Icon from "./Icon";

type P = {
  light?: boolean;
};
const cssStyle = ({ light }: P) => css`
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  padding: 0.7em 1em;
  outline: none;
  border: none;
  border-radius: 3px;
  background: ${light ? "transparent" : "var(--primary-color)"};
  color: ${light ? "var(--accent-color)" : "#fff"};
  text-transform: uppercase;
  white-space: nowrap;
  text-decoration: none;
  font-weight: 500;
  font-size: 0.8em;
  line-height: 1;
  transition: all 0.3s cubic - bezier(0.55, 0, 0.1, 1);
  min-height: var(--input-min-height);
  :hover {
    background-color: ${light ? "rgba(0, 0, 0, 0.05)" : "var(--accent-color)"};
  }
  & > span:not(:empty) {
    margin-left: 0.4em;
  }
`;
export const StyledButton = styled("button")`
  ${(p: P) => cssStyle(p)}
`;
export const StyledLink = styled("a")`
  ${(p: P) => cssStyle(p)}
  padding-top: 0;
  padding-bottom: 0;
`;

type Props = {
  icon?: string;
  children?: any;
  light?: boolean;
} & (
  | React.ButtonHTMLAttributes<HTMLButtonElement> & { asLink?: false }
  | React.AnchorHTMLAttributes<HTMLAnchorElement> & { asLink: true });

export default function Button({ icon, children, asLink, ...props }: Props) {
  const Element: any = asLink ? StyledLink : StyledButton;
  return (
    <Element type={!asLink ? "button" : undefined} {...props}>
      {icon && <Icon path={icon} />}
      <span>{children && children}</span>
    </Element>
  );
}
