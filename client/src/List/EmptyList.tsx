import React from "react";
import styled from "react-emotion";

const Root = styled("div")`
  height: 100%;
  position: relative;
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

export default function EmptyList() {
  return (
    <Root>
      <Text>
        <svg width="197" height="170">
          <g fill="#848484">
            <path d="M140.33 131v35h-27.66v-21h-6.92C94.29 145 85 135.6 85 124v-21c0-3.87 3.1-7 6.92-7a6.96 6.96 0 0 1 6.91 7v21c0 3.92 3.12 7 6.92 7h6.92V61c0-7.73 6.19-14 13.83-14s13.83 6.27 13.83 14v56h6.92a6.96 6.96 0 0 0 6.92-7V96c0-3.87 3.1-7 6.91-7a6.96 6.96 0 0 1 6.92 7v14c0 11.6-9.29 21-20.75 21h-6.92zM22.9 31.33a3.9 3.9 0 0 1-3.9-3.91 3.9 3.9 0 0 1 3.9-3.92h31.15c4.3 0 7.8-3.5 7.8-7.83a7.81 7.81 0 0 0-7.8-7.84 7.6 7.6 0 0 0-5.49 2.31 3.78 3.78 0 0 1-5.53 0 3.96 3.96 0 0 1 0-5.56A15.63 15.63 0 0 1 54.05 0c8.6 0 15.58 7.01 15.58 15.67 0 8.65-6.97 15.66-15.58 15.66H22.9z" />
            <path d="M81.32 39.17a3.9 3.9 0 0 0 3.9-3.92 3.9 3.9 0 0 0-6.67-2.78 3.86 3.86 0 0 1-5.5 0 3.99 3.99 0 0 1 0-5.52 11.62 11.62 0 0 1 8.27-3.45C87.77 23.5 93 28.76 93 35.25S87.77 47 81.32 47H26.79a3.9 3.9 0 0 1-3.9-3.92 3.9 3.9 0 0 1 3.9-3.91h54.53zM4 170c-2.2 0-4-1.71-4-3.83a3.92 3.92 0 0 1 4-3.85l189-.32c2.2 0 4 1.71 4 3.83a3.92 3.92 0 0 1-4 3.85L4 170z" />
          </g>
        </svg>
        <Heading>No content yet</Heading>
        Start filling the vast
      </Text>
    </Root>
  );
}
