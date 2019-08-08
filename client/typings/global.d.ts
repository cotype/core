import { CSSProp } from "styled-components/macro";
import { DOMAttributes } from "react";

declare module "react" {
  interface HTMLAttributes<T> extends DOMAttributes<T> {
    css?: CSSProp;
  }
}
