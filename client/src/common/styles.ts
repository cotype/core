import styled, { css } from "react-emotion";

export const fieldGroupClass = css`
  box-sizing: border-box;
  padding-top: 24px;
  padding-bottom: 24px;
  padding-left: 24px;
`;

export const fieldClass = css`
  display: block;
  margin-bottom: 24px;
`;

export const labelClass = css`
  display: block;
  color: #848484;
  margin-bottom: 6px;
`;

export const errorClass = css`
  color: var(--error-color);
  margin-top: 6px;
`;

export const inputClass = css`
  background: #fff;
  border-radius: 4px;
  width: 100%;
  box-sizing: border-box;
  font-size: inherit;
  border: 1px solid rgba(0, 0, 0, 0.16);
  padding: 10px;
  outline: none;
  transition: box-shadow 0.1s ease, width 0.1s ease;
  min-height: var(--input-min-height);
  :focus,
  :active {
    border-color: var(--accent-color);
    box-shadow: 0 0 0 3px var(--semi-transparent-accent-color);
  }
`;

export const outputClass = css`
  width: 100%;
  box-sizing: border-box;
  font-size: inherit;
  outline: none;
  min-height: var(--input-min-height);
  background: #fff;
  padding: 10px;
  border-radius: 4px;
`;

export const buttonClass = css`
  background: var(--primary-color);
  font-size: 1.5em;
  color: #fff;
  border: none;
  border-radius: 3px;
  padding: 0.5em 2em;
`;

export const Input = styled("input")(inputClass);
export const Field = styled("label")(fieldClass);
export const Label = styled("div")(labelClass);
export const Error = styled("div")(errorClass);
export const Button = styled("button")(buttonClass);
