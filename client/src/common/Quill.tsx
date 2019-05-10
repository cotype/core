import React from "react";
import { css } from "react-emotion";
import Loadable from "react-loadable";
// import "react-quill/dist/quill.bubble.css";
import "react-quill/dist/quill.snow.css";
import { outputClass } from "./styles";

const nonInteractive = css`
  ${outputClass} & .ql-editor {
    /* padding: 0; */
  }
`;
const interactiveStyles = css`
  & {
    background: #fff;
    & .ql-editor {
      min-height: 80px;
    }
  }
`;

type P = {
  interactive?: boolean;
};
const editorClass = (p: P) => css`
  ${p.interactive ? interactiveStyles : nonInteractive}
  .ql-toolbar {
    border-radius: 3px 3px 0 0;
    border-bottom-color: rgba(0, 0, 0, 0.16) !important;
  }
  .ql-container {
    border-radius: 0 0 3px 3px;
    font-family: inherit;
  }
  .ql-toolbar,
  .ql-container {
    border-color: rgba(0, 0, 0, 0.16);
  }
  .ql-editor ol,
  .ql-editor ul,
  .ql-editor pre,
  .ql-editor blockquote,
  .ql-editor h1,
  .ql-editor h2,
  .ql-editor h3,
  .ql-editor h4,
  .ql-editor h5,
  .ql-editor h6 {
    margin-bottom: 1em;
  }
  .ql-bubble .ql-tooltip {
    z-index: 2;
  }
  :focus-within {
    box-shadow: 0 0 0 3px var(--semi-transparent-accent-color);
    .ql-toolbar,
    .ql-container {
      border-color: var(--accent-color);
    }
  }
`;

// Quill is big, load it on demand ...
const ReactQuill = Loadable({
  loader: () => import("react-quill"),
  loading: () => null,
  render(loaded: any, { innerRef, ...props }: any) {
    const Component = loaded.default;
    return <Component ref={innerRef} {...props} />;
  }
});

export default function Quill({ ...props }: any) {
  const interactive = props.theme !== null;
  return (
    <ReactQuill
      className={editorClass({ interactive })}
      style={{ padding: 0, margin: 0 }}
      {...props}
    />
  );
}
