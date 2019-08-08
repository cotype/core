import React, { Component } from "react";
import styled from "styled-components/macro";
import api from "../../api";
import Image from "../../Media/Image";
import * as Cotype from "../../../../typings";

const Root = styled("div")`
  display: flex;
  flex: 1;
  align-items: center;
`;

type Props = {
  value: any;
};

type ExternalImage = {
  id: string;
  originalname: string;
  width: "auto";
  height: "auto";
};

type State = {
  media?: Cotype.Media | ExternalImage;
};

export default class MediaOutput extends Component<Props, State> {
  static getSummaryImage(props: Props) {
    return <MediaOutput {...props} />;
  }
  state: State = {};

  componentDidMount() {
    this.fetchMedia();
  }

  componentDidUpdate(prevProps: Props) {
    const id = this.props.value;
    if (id !== prevProps.value) this.fetchMedia();
  }

  fetchMedia() {
    const id: string = this.props.value;
    if (!id) {
      this.setState({ media: undefined });
    } else if (id.includes("://")) {
      this.setState({
        media: {
          id,
          originalname: id.replace(/.+\//, ""),
          width: "auto",
          height: "auto"
        }
      });
    } else {
      api.loadMedia(id).then(media => this.setState({ media }));
    }
  }

  render() {
    const { media } = this.state;
    return (
      <div>
        <Root>{media && <Image {...media} />}</Root>
      </div>
    );
  }
}
