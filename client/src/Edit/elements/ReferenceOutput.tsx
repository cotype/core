import React, { Component } from "react";
import styled from "styled-components/macro";
import api from "../../api";
import ImageCircle from "../../common/ImageCircle";

const ImageItem = styled("div")`
  display: flex;
  align-items: center;
`;

type Props = {
  type: string;
  model: string;
  value: {
    id: string;
    model: string;
  };
};
type State = {
  value?: any;
};
export default class ReferenceOutput extends Component<Props, State> {
  static getSummaryText(props: Props) {
    if (!props.value) return null;
    return <ReferenceOutput {...props} />;
  }

  state: State = {};

  componentDidMount() {
    this.fetchData();
  }

  componentDidUpdate(prevProps: Props) {
    const { type, model, value } = this.props;
    if (
      type !== prevProps.type ||
      model !== prevProps.model ||
      value !== prevProps.value
    ) {
      if (value) {
        this.fetchData();
      } else {
        this.setState({ value: null });
      }
    }
  }

  fetchData() {
    const { type, value } = this.props;
    if (!(value || {}).model) return;
    api
      .get(`/${type}/${value.model}/${value.id}/item`)
      .then(v => this.setState({ value: v }));
  }

  render() {
    const { value } = this.state;
    if (!value) return null;
    if ("image" in value) {
      const src =
        value.image &&
        (value.image.includes("://")
          ? value.image
          : `/thumbs/square/${value.image}`);
      return (
        <ImageItem>
          <ImageCircle src={src} alt={value.title} size={12} />
          {value.title}
        </ImageItem>
      );
    }
    return value.title;
  }
}
