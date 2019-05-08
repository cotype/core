import React, { Component, Fragment } from "react";
import styled, { css, cx } from "react-emotion";
import { FieldProps } from "formik";
import query from "object-to-querystring";
import { inputClass } from "../../common/styles";
import Autocomplete from "../../common/Autocomplete";
import ImageCircle from "../../common/ImageCircle";
import api from "../../api";
import { required } from "./validation";
import ColorHash from "color-hash";
import { Item, ReferenceType } from "../../../../typings";

const colorHash = new ColorHash({ saturation: 0.7, lightness: 0.6 });

const Root = styled("div")`
  ${inputClass} padding: 0;
  padding-left: 10px;
`;

const borderlessClass = css`
  border: none;
  box-sizing: border-box;
  padding: 4px 10px;
  flex: 1;
  font-size: inherit;
  height: 40px;
  outline: none;
`;

const Kind = styled("div")`
  margin-left: auto;
  border-radius: 3px;
  color: #fff;
  font-size: 0.8em;
  padding: 2px 5px;
`;

const ImageItem = styled("div")`
  width: 100%;
  display: flex;
  align-items: center;
  text-decoration: none;
  color: var(--dark-color);
`;

const Select = styled("select")`
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
  items: Item[];
  value: Ref;
  // clearSelection: (() => void) | null;
  internalRef: boolean;
  prevValue: Ref;
};

export default class ReferenceInput extends Component<Props, State> {
  static validate(value, props) {
    const isRequired = required(value, props);
    if (isRequired) return isRequired;
  }

  state: State = {
    items: [],
    value: null,
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

  onInputValueChange = (inputValue, downshift) => {
    if (inputValue) this.fetchItems({ q: inputValue });
    else this.fetchItems({});
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
    const [firstModel, ...otherModels] = models;

    const queryString = query({
      ...opts,
      linkable: models.length === 0,
      models: otherModels && otherModels.length ? models : undefined
    });

    // if reference has only one options, use list instead of search
    return api
      .get(
        `/${type}${
          models.length === 0 || otherModels.length > 0 ? "" : `/${firstModel}/`
        }${queryString}`
      )
      .then(res => {
        if (res) this.setState({ items: res.items });
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

  renderItem = i => {
    if ("image" in i) {
      const src = i.image
        ? i.image.includes("://")
          ? i.image
          : `/thumbs/square/${i.image}`
        : null;
      return (
        <ImageItem>
          <ImageCircle src={src} alt={i.title} size={12} />
          {i.title}
          {i.kind && (
            <Kind style={{ background: colorHash.hex(i.kind) }}>{i.kind}</Kind>
          )}
        </ImageItem>
      );
    }
    return i.title;
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
              inputClassName={borderlessClass}
              selectedItem={value ? value : null}
              onInputValueChange={this.onInputValueChange}
              onChange={this.onChange}
              items={items}
              name={this.props.field.name}
              itemToString={this.itemToString}
              renderItem={this.renderItem}
              placeholder={placeholder ? placeholder : undefined}
            />
          </Root>
        ) : (
          <input
            className={cx([
              inputClass,
              css`
                min-height: 44px;
              `
            ])}
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
