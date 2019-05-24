import React, { Component } from "react";
import styled, { css } from "react-emotion";
import { FieldProps } from "formik";
import { inputClass } from "../../common/styles";
import Autocomplete from "../../common/Autocomplete";
import ImageCircle from "../../common/ImageCircle";
import api from "../../api";
import { required } from "./validation";
import { stringify } from "qs";

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

const ImageItem = styled("div")`
  display: flex;
  align-items: center;
`;

type Props = FieldProps<any> & {
  type: string;
  model: string;
  required?: boolean;
  placeholder?: string;
};

type State = {
  items: any[];
  value: string | null;
  clearSelection: (() => void) | null;
};

export default class SingleReferenceInput extends Component<Props, State> {
  static validate(value, props) {
    const isRequired = required(value, props);
    if (isRequired) return isRequired;
  }

  state: State = {
    items: [],
    value: null,
    clearSelection: null
  };

  autocomplete: any;

  componentDidMount() {
    const id = this.props.field.value;
    if (id) this.fetchItem(id);
    this.fetchItems({});
  }

  componentDidUpdate(prevProps: Props) {
    const id = this.props.field.value;

    if (prevProps.field.value !== id) {
      const { clearSelection } = this.state;
      if (id) this.fetchItem(id);
      // if (id === null && clearSelection) clearSelection();
    }
  }

  onInputValueChange = (inputValue, downshift) => {
    if (inputValue)
      this.fetchItems({ search: { term: inputValue, scope: "title" } });
    else this.fetchItems({});
  };

  onChange = (value, stateAndHelpers: { clearSelection: () => void }) => {
    this.setState({ value, clearSelection: stateAndHelpers.clearSelection });
    this.props.form.setFieldValue(
      this.props.field.name,
      value ? value.id : null
    );
  };

  fetchItems = opts => {
    const { type, model } = this.props;

    const queryString = stringify(opts);

    return api
      .get(`/${type}/${model}${queryString ? "?" + queryString : ""}`)
      .then(({ items }) => this.setState({ items }));
  };

  fetchItem = id => {
    const { type, model } = this.props;
    return api
      .get(`/${type}/${model}/${id}/item`)
      .then(value =>
        this.setState({ value: this.props.field.value ? value : null })
      )
      .catch(() => {
        this.props.form.setFieldValue(this.props.field.name, null);
      });
  };

  itemToString = i => (i ? i.title : "");

  renderItem = i => {
    if ("image" in i) {
      const src =
        i.image &&
        (i.image.includes("://") ? i.image : `/thumbs/square/${i.image}`);
      return (
        <ImageItem>
          <ImageCircle src={src} alt={i.title} size={12} />
          {i.title}
        </ImageItem>
      );
    }
    return i.title;
  };

  render() {
    const { value, items } = this.state;
    const { placeholder } = this.props;
    return (
      <Root>
        <Autocomplete
          toggleButton
          inputClassName={borderlessClass}
          selectedItem={value ? value : null}
          onInputValueChange={this.onInputValueChange}
          onChange={this.onChange}
          name={this.props.field.name}
          items={items}
          itemToString={this.itemToString}
          renderItem={this.renderItem}
          placeholder={placeholder ? placeholder : undefined}
        />
      </Root>
    );
  }
}
