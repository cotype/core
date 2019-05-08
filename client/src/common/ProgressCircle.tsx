import React from "react";
import { css } from "react-emotion";
import CircularProgressbar from "react-circular-progressbar";

const classes = {
  path: css`
    stroke: var(--primary-color);
    stroke-linecap: round;
    transition: stroke-dashoffset 0.5s ease 0s;
  `,
  trail: css`
    stroke: #ddd;
  `,
  text: css`
    fill: var(--primary-color);
    font-size: 20px;
    dominant-baseline: middle;
    text-anchor: middle;
  `,
  background: css`
    fill: #ddd;
  `
};

type Props = {
  percentage: number;
  size?: number | string;
};
export default function ProgressCircle({ percentage, size = "100%" }: Props) {
  return (
    <CircularProgressbar
      percentage={percentage}
      text={`${percentage}%`}
      classes={classes}
      styles={{ root: { width: size } }}
    />
  );
}
