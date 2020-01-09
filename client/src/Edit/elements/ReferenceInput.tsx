import React, { Component } from "react";
import styled, { css } from "styled-components/macro";
import { FieldProps } from "formik";
import orderSearchResults from "../../utils/orderSearchResults";
import { stringify } from "qs";
import { inputClass, Input } from "../../common/styles";
import Autocomplete from "../../common/Autocomplete";
import api from "../../api";
import { required } from "./validation";
import { ReferenceType, SearchResultItem } from "../../../../typings";
import { BasicResultItem } from "../../common/ResultItem";
import { ControllerStateAndHelpers } from "downshift";

const validationRegex = /W*(http:\/\/|https:\/\/|mailto:|tel:)W*|^\/.*$/gm;

const Root = styled("div")`
  ${inputClass};
  padding: 0;
  min-width: 0;
`;

export const borderlessCss = css`
  border: none;
  box-sizing: border-box;
  padding: 4px 10px 4px 0;
  flex: 1;
  font-size: inherit;
  height: 40px;
  outline: none;
  :focus,
  :active {
    border-color: none;
    box-shadow: none;
  }
`;

const Select = styled("select")`
  flex-shrink: 0;
  display: flex;
  flex-direction: row;
  & > div:not(:last-child) {
    border-left: grey;
  }
  ${inputClass};
  width: auto;
  margin-right: 0.6em;
  min-height: 44px;
`;

type Option = {
  active?: boolean;
};
const Option = styled("option")`
  background: ${({ active }: Option) => (active ? "blue" : "transparent")};
`;

type Props = FieldProps<ReferenceType> & {
  type: string;
  models: string[];
  required?: boolean;
  placeholder?: string;
  allowAbsoluteRefs?: boolean;
};

type Ref = { id: string; model: string } | null;

type State = {
  items: SearchResultItem[];
  value: Ref;
  searchTerm: string;
  internalRef: boolean;
  prevValue: Ref;
};

export default class ReferenceInput extends Component<Props, State> {
  static validate(value, props) {
    const isRequired = required(value ? value.id : null, props);
    if (isRequired) return isRequired;
    if (!value || value.model || !value.id) return;
    const check = value.id.toString().match(validationRegex);
    if (!check) {
      return 'This url is not valid. Links to the same domain need to start with "/", to other domains with a valid protocol (http/https) or with a valid contact protocol (mailto/tel).';
    }
  }

  state: State = {
    items: [],
    value: null,
    searchTerm: "",
    internalRef: true,
    prevValue: null
  };

  autocomplete: any;

  componentDidMount() {
    const id = this.props.field.value;
    if (id) this.fetchItem(id);
    this.fetchItems({});
  }

  componentDidUpdate(prevProps: Props) {
    const ref = this.props.field.value;

    if (prevProps.field.value !== ref) {
      if (ref) {
        this.fetchItem(ref);
      } else {
        this.setState({ value: null, prevValue: null, internalRef: true });
      }
    }
  }

  onInputValueChange = (
    inputValue,
    { isOpen }: ControllerStateAndHelpers<any>
  ) => {
    if (inputValue) {
      this.fetchItems({ q: inputValue });
      this.setState({ searchTerm: isOpen ? inputValue : "" });
    } else this.fetchItems({});
  };

  onChange = value => {
    this.setState({ value });
    this.props.form.setFieldValue(
      this.props.field.name,
      value ? { id: value.id, model: value.model } : null
    );
    if (!value) this.fetchItems({});
    else this.fetchItems({});
  };

  fetchItems = opts => {
    const { type, models } = this.props;

    const queryString = stringify({
      ...opts,
      linkable: models.length === 0,
      models: models.length ? models : undefined
    });

    return api.get(`/${type}?${queryString}`).then(({ items }) => {
      this.setState({
        items: orderSearchResults(items, this.state.searchTerm)
      });
    });
  };

  fetchItem = refObj => {
    const { type } = this.props;
    if (!(refObj || {}).model) {
      return this.setState({ internalRef: false, value: refObj });
    }

    return api
      .get(`/${type}/${refObj.model}/${refObj.id}/item`)
      .then(value => {
        this.setState({
          value: this.props.field.value ? value : null,
          internalRef: value.model ? true : false
        });
      })
      .catch(() => {
        this.props.form.setFieldValue(this.props.field.name, null);
      });
  };

  itemToString = i => (i ? i.title : "");

  renderItem = (i, term: string) => {
    return <BasicResultItem item={i} term={term}></BasicResultItem>;
  };

  onInputTypeChange = (e: React.FormEvent<HTMLSelectElement>) => {
    const internalRef = e.currentTarget.value === "intern";
    this.setState(prev => ({
      internalRef,
      value: prev.prevValue ? prev.prevValue : null,
      prevValue: prev.value
    }));
  };

  render() {
    const { value, items, internalRef } = this.state;
    const { placeholder, allowAbsoluteRefs } = this.props;

    return (
      <div style={{ display: "flex" }}>
        {allowAbsoluteRefs && (
          <Select
            value={internalRef ? "intern" : "extern"}
            onChange={this.onInputTypeChange}
          >
            <Option>intern</Option>
            <Option>extern</Option>
          </Select>
        )}
        {internalRef || !allowAbsoluteRefs ? (
          <Root>
            <Autocomplete
              toggleButton
              inputElementCss={borderlessCss}
              selectedItem={value ? value : null}
              onInputValueChange={this.onInputValueChange}
              onChange={this.onChange}
              items={items}
              name={this.props.field.name}
              itemToString={this.itemToString}
              renderItem={item => this.renderItem(item, this.state.searchTerm)}
              placeholder={placeholder ? placeholder : undefined}
              style={{ paddingLeft: "10px" }}
            />
          </Root>
        ) : (
          <Input
            css={css`
              min-height: 44px;
            `}
            value={value ? value.id : ""}
            placeholder="/path/to/page or https://site.de/path/to/page"
            onChange={e => {
              this.onChange({ id: e.currentTarget.value, model: undefined });
            }}
          />
        )}
      </div>
    );
  }
}
