import React from "react";
import styled from "styled-components/macro";
export type Props = React.SVGProps<SVGSVGElement> & {
  path: string;
  ref?: any;
};

export default function Icon({ path, ...props }: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      {...props}
    >
      <path d={path} fill="currentColor" />
    </svg>
  );
}
