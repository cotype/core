import React, { Component } from "react";
import styled from "styled-components/macro";
import Button from "./common/Button";
import { paths } from "./common/icons";
import { HEIGHT as HEADER_HEIGHT } from "./Header";

const Container = styled("div")`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: calc(100% - ${HEADER_HEIGHT});
  margin: 1em;
`;

const StyledButton = styled(Button)`
  margin-top: 13rem;
`;

type State = {
  hasError: boolean;
};
export default class ErrorBoundary extends Component<{}, State> {
  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  componentDidCatch(error, info) {
    console.error(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Container>
          <h2>Ups, something went wrong.</h2>
          <p>
            If you encounter this problem more then once, please let the IT guy
            know!
          </p>
          <StyledButton
            icon={paths.Reload}
            onClick={() => window.location.reload()}
          >
            Reload
          </StyledButton>
        </Container>
      );
    }

    return this.props.children;
  }
}
