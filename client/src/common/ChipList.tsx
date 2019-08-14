import React, { Component } from "react";
import styled from "styled-components/macro";
import ColorHash from "color-hash";
import { Input } from "./styles";
import Button from "./Button";
import Icon, { paths } from "./icons";
import { testable } from "../utils/helper";

const colorHash = new ColorHash({ saturation: 0.7, lightness: 0.6 });

export const Item = styled("div")`
  box-sizing: border-box;
  color: "#fff";
  border: none;
  min-height: var(--input-min-height);
  outline: none;
  padding: 5px;
  display: inline-flex;
  transition: background-color 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,
    box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
  white-space: nowrap;
  align-items: center;
  border-radius: 4px;
  vertical-align: middle;
  text-decoration: none;
  justify-content: center;
  /* background-color: var(--transparent-grey); */
  margin: 0 10px 10px 0;
  /* border-left: 5px solid var(--primary-color); */
`;

const StyledButton = styled("button")`
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  :focus {
    outline: 0;
  }
`;
const Root = styled("div")`
  margin: 10px 0;
`;
const Form = styled("form")`
  display: flex;
  width: 100%;
`;

const ClearCircleIcon = styled(Icon.ClearCircle)`
  color: rgba(255, 255, 255, 0.8);
  margin: 0 0 0 4px;
`;

type Props = {
  values?: string[];
  onAdd: (value: string) => void;
  onDelete: (index: number) => void;
};

type State = {
  newValue: string;
};

export default class ChipList extends Component<Props, State> {
  state: State = {
    newValue: ""
  };

  onAdd = () => {
    const { newValue } = this.state;
    this.props.onAdd(newValue);
    this.setState({ newValue: "" });
  };
  render() {
    const { values, onDelete } = this.props;
    const { newValue } = this.state;
    return (
      <Root>
        {values &&
          values.map((v, index) => (
            <Item key={index} style={{ background: colorHash.hex(v) }}>
              {v}
              <StyledButton type="button" onClick={() => onDelete(index)}>
                <ClearCircleIcon />
              </StyledButton>
            </Item>
          ))}
        <Form
          onSubmit={e => {
            e.preventDefault();
            this.onAdd();
          }}
        >
          <Input
            {...testable("chip-list-input")}
            value={newValue}
            onChange={e => this.setState({ newValue: e.target.value })}
          />
          <Button icon={paths.Plus} light type="submit">
            Add
          </Button>
        </Form>
      </Root>
    );
  }
}
