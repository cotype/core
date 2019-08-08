import React, { Fragment } from "react";
import styled from "styled-components/macro";
import Overlay from "./Overlay";
import Icon from "./Icon";

const Title = styled("div")`
  color: #fff;
  background: var(--primary-color);
  border-radius: 3px 3px 0 0;
  font-size: 1.5em;
  padding: 10px 20px;
  font-weight: 300;
  z-index: 1;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.16);
  display: flex;
  align-items: center;
`;

const Body = styled("div")`
  padding: 20px;
  color: #34363a;
  flex: 1;
  overflow-y: auto;
  height: 100%;
  max-height: 100%;
`;

export const ActionBar = styled("div")`
  z-index: 1;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.16);
  width: 100%;
  background: #fff;
  display: flex;
  flex-direction: row;
  padding: 0.5em 2em;
  box-sizing: border-box;
  & > * {
    margin-left: 1em;
  }
`;

export const StyledIcon = styled(Icon)`
  margin-right: 0.5em;
`;

type Props = {
  title: string;
  children: any;
  onClose?: () => void;
  actionButtons?: any;
  style?: object;
  bodyStyle?: object;
  icon?: string;
};

export default function ModalDialog({
  title,
  children,
  onClose,
  actionButtons,
  style,
  bodyStyle,
  icon
}: Props) {
  return (
    <Overlay
      onClose={onClose}
      style={{ color: "#fff", maxWidth: "90vw", ...style }}
    >
      <Title>
        {icon && <StyledIcon path={icon} />}
        {title}
      </Title>
      <Body style={bodyStyle ? bodyStyle : undefined}>{children}</Body>
      {actionButtons && (
        <ActionBar>
          <div style={{ flex: 1 }} />
          {actionButtons.map((b, index) => (
            <Fragment key={index}>{b}</Fragment>
          ))}
        </ActionBar>
      )}
    </Overlay>
  );
}
