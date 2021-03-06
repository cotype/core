import React, { Component } from "react";
import styled, { css } from "styled-components/macro";
import { Error } from "../common/styles";
import { errorClass } from "../Edit/Form";

const FieldBlock = styled("div")`
  box-sizing: border-box;
  /* padding-top: 24px;
  padding-bottom: 24px;
  padding-left: 24px; */
  padding: 24px;
`;

const FieldListBlock = styled("div")`
  box-sizing: border-box;
  padding-top: 12px;
  padding-bottom: 12px;
`;

const labelColor = css`
  color: var(--dark-color);
  font-weight: bold;
`;

const LabelBlock = styled("div")`
  ${labelColor} margin-bottom: 0.5em;
`;

const InlineLabel = styled("span")`
  ${labelColor} margin-left: 0.2em;
  margin-right: 1em;
`;

const Cell = styled("td")`
  padding-bottom: 1em;
`;

const LabelCell = styled(Cell)`
  ${labelColor} min-width: 125px;
`;

// TODO can we remove inline and inList?
export type FieldLayout =
  | "vertical"
  | "horizontal"
  | "modal"
  | "inline"
  | "inList";

type Props = {
  layout?: FieldLayout;
  fields: {
    key?: string;
    error?: string;
    label: any;
    element: any;
  }[];
};

export default class Fields extends Component<Props> {
  render() {
    const errorHandler = error =>
      typeof error === "string" && (
        <Error className={errorClass}>{error}</Error>
      );

    const { fields, layout = "vertical" } = this.props;
    if (layout === "horizontal") {
      return (
        <table>
          <tbody>
            {fields.map(f => (
              <tr key={f.key || f.label}>
                <LabelCell>{f.label}</LabelCell>
                <Cell>{f.element}</Cell>
                {errorHandler(f.error)}
              </tr>
            ))}
          </tbody>
        </table>
      );
    }
    if (layout === "inline") {
      return (
        <div>
          {fields.map(f => (
            <label key={f.key || f.label}>
              {f.element}
              <InlineLabel>{f.label}</InlineLabel>
              {errorHandler(f.error)}
            </label>
          ))}
        </div>
      );
    }
    if (layout === "inList") {
      return (
        <div style={{ width: "100%" }}>
          {fields.map(f => (
            <FieldListBlock key={f.key || f.label}>
              <LabelBlock>{f.label}</LabelBlock>
              <div>{f.element}</div>
              {errorHandler(f.error)}
            </FieldListBlock>
          ))}
        </div>
      );
    }
    return (
      <div>
        {fields.map(f => (
          <FieldBlock key={f.key || f.label}>
            <LabelBlock>{f.label}</LabelBlock>
            <div>{f.element}</div>
            {errorHandler(f.error)}
          </FieldBlock>
        ))}
      </div>
    );
  }
}
