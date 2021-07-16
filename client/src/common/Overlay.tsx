import React, { Component } from "react";
import ReactDOM from "react-dom";
import styled from "styled-components/macro";
import { icons } from "@cotype/ui";
import { testable } from "../utils/helper";
const Backdrop = styled("div")`
  position: fixed;
  display: flex;
  z-index: 4;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: rgba(0, 0, 0, 0.7);
`;

const Modal = styled("div")`
  margin: auto;
  background: #fff;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.7);
  border-radius: 4px;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
  max-height: 90vh;
`;

const Close = styled("div")`
  z-index: 1;
  position: absolute;
  top: 12px;
  right: 12px;
  width: 22px;
  height: 22px;
  cursor: pointer;
  svg {
    width: 100%;
    height: 100%;
  }
`;

type Props = {
  onClose?: () => void;
  height?: string;
  width?: string;
  style?: object;
  children: React.ReactNode;
};

export default class Overlay extends Component<Props> {
  close = ev => {
    const { onClose } = this.props;
    ev.stopPropagation();
    if (onClose) onClose();
  };

  renderOverlay() {
    const { style, children } = this.props;
    return (
      <Backdrop {...testable("overlay")}>
        <Modal onClick={ev => ev.stopPropagation()} style={style}>
          {children}
          <Close onClick={this.close}>
            <icons.Clear />
          </Close>
        </Modal>
      </Backdrop>
    );
  }

  render() {
    const overlay = this.renderOverlay();
    const el = document.getElementById("modal");
    return el ? ReactDOM.createPortal(overlay, el) : overlay;
  }
}
