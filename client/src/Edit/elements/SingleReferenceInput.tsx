import React, { Component } from "react";
import styled from "styled-components/macro";
import { FieldProps } from "formik";

import { inputClass , ImageCircle} from "@cotype/ui";
import Autocomplete from "../../common/Autocomplete";
import api from "../../api";
import { required } from "./validation";
import { stringify } from "qs";
import { borderlessCss } from "./ReferenceInput";

const Root = styled("div")`
  ${inputClass} padding: 0;
  padding-left: 10px;
`;

const ImageItem = styled("div")`
  display: flex;
  align-items: center;
`;

type Props = FieldProps<any> & {
  type: string;
  models: [string];
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
      // const { clearSelection } = this.state;
      if (id) this.fetchItem(id);
      // if (id === null && clearSelection) clearSelection();
    }
  }

  onInputValueChange = (inputValue, downshift) => {
    if (inputValue) this.fetchItems({ q: inputValue });
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
    const { type, models } = this.props;

    const queryString = stringify(opts);

    return api
      .get(`/${type}/${models[0]}${queryString ? "?" + queryString : ""}`)
      .then(({ items }) => this.setState({ items }));
  };

  fetchItem = id => {
    const { type, models } = this.props;
    return api
      .get(`/${type}/${models[0]}/${id}/item`)
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
          inputElementCss={borderlessCss}
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
