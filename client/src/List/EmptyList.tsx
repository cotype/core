import React from "react";
import styled from "react-emotion";

const Root = styled("div")`
  height: 100%;
  position: relative;
  & svg {
    position: absolute;
    bottom: 80px;
    right: 80px;
  }
`;

const Text = styled("div")`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80%;
  text-align: center;
  overflow: hidden;
  color: #848484;
`;

const Heading = styled("div")`
  font-size: 1.8em;
  margin-bottom: 0.5em;
`;

const Arrow = () => (
  <svg width="103" height="215" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M86.356 203.826c-27.223-21.862-47.972-45.843-62.234-71.943C7.353 101.196-.472 57.895.596 1.971l.029-1.5 3 .058-.03 1.5c-1.059 55.446 6.678 98.254 23.16 128.416 14.052 25.714 34.517 49.377 61.408 70.985l4.79-6.349 9.446 19.027-20.889-3.86 4.846-6.422z"
      fill="#848484"
    />
  </svg>
);

export default function EmptyList() {
  return (
    <Root>
      <Text>
        <Heading>This collection is empty</Heading>
        Start filling it right away!
      </Text>
      <Arrow />
    </Root>
  );
}
