import React, { SyntheticEvent, ReactNode, InputHTMLAttributes } from "react";
import styled from "react-emotion";

const FileInput = styled("input")`
  top: 0;
  right: 0;
  opacity: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
  position: absolute;
`;

const Container = styled("div")`
  overflow: hidden;
  position: relative;
`;

type Props = InputHTMLAttributes<HTMLInputElement> & {
  onFiles: (files: FileList) => void;
  children: ReactNode;
};

export default function UploadField({ onFiles, children, ...rest }: Props) {
  return (
    <Container>
      {children}
      <FileInput
        {...rest}
        type="file"
        onChange={e => {
          if (!e.target.files) {
            return;
          }
          onFiles(e.target.files);
        }}
      />
    </Container>
  );
}
