import React from "react";
import styled from "react-emotion";

import ColorHash from "color-hash";
const colorHash = new ColorHash({ saturation: 0.7, lightness: 0.6 });

const Circle = styled("div")`
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f5f5;
  width: 3em;
  height: 3em;
  overflow: hidden;
  border-radius: 100%;
  background-position: 50%;
  background-size: cover;
  margin-right: 0.6em;
  text-transform: uppercase;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.5);
`;

type Props = {
  src: string | null;
  alt: string | number;
  size?: number;
};
export default function ImageCircle({
  src,
  alt = "",
  size = 24,
  ...rest
}: Props) {
  return (
    <Circle
      {...rest}
      style={{
        backgroundColor: src ? "transparent" : colorHash.hex(alt),
        backgroundImage: src ? `url(${src})` : "none",
        fontSize: size
      }}
    >
      {!src && alt.toString().slice(0, 2)}
    </Circle>
  );
}
