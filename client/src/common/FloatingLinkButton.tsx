import React from "react";
import { css } from "react-emotion";
import { Link, LinkProps } from "react-router-dom";
import { testable } from "../utils/helper";

const buttonClass = css`
  position: absolute;
  right: 15px;
  bottom: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #70c8dc;
  background-color: var(--accent-color);
  color: #fff;
  text-decoration: none;
  height: 60px;
  width: 60px;
  border-radius: 50%;
  box-shadow: 0 3px 5px rgba(0, 0, 0, 0.2);
  z-index: 1;
`;

const Plus = () => (
  <svg width="21" height="20" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M13 7.5h7a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-.5.5h-7v7a.5.5 0 0 1-.5.5h-4a.5.5 0 0 1-.5-.5v-7H1a.5.5 0 0 1-.5-.5V8a.5.5 0 0 1 .5-.5h7v-7a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 .5.5v7z"
      fill="#FFF"
      fillRule="evenodd"
    />
  </svg>
);

export default function FloatingLinkButton(props: LinkProps) {
  return (
    <Link {...testable("add-button")} className={buttonClass} {...props}>
      <Plus />
    </Link>
  );
}
