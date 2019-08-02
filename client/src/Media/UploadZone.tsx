import React, { useMemo, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { useUpload } from "react-use-upload";
import createValidator, { MediaFilter } from "./createValidator";
import useValidation from "./useValidation";

export type Props = {
  render: any;
  onUpload: any;
  className: string;
  activeClass: string;
  multiple?: boolean;
  mediaType?: string;
  mediaFilter?: MediaFilter;
};

const noop = () => {
  /* noop */
};

export default function UploadZone({
  render,
  onUpload,
  className,
  activeClass,
  multiple,
  mediaType,
  mediaFilter
}: Props) {
  const validator = useMemo(() => createValidator(mediaType, mediaFilter), [
    mediaType,
    mediaFilter
  ]);
  const [files, onFiles, reset] = useValidation(validator);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple,
    noKeyboard: true,
    noClick: true,
    onDrop: onFiles
  });
  const { done, response, progress, error } = useUpload(files as any, {
    path: "/upload",
    name: "file",
    withCredentials: true
  });
  useEffect(() => {
    if (!done) return;
    reset();
    onUpload(response.response);
  }, [done, response, onUpload, reset]);

  return (
    <div
      {...getRootProps()}
      onClick={
        noop /* Even though we told dropzone to not care for clicks, it prevents default.
                (https://github.com/react-dropzone/react-dropzone/blob/93bded79f01641aaf5c4d29642a881cdc0e77bcf/src/index.js#L461)
                We need to overwrite in order to work with nested file inputs */
      }
      className={`${className} ${isDragActive ? activeClass : ""}`}
    >
      <input {...getInputProps()} />
      {render({...{
          ...response,
          complete: done,
          onFiles,
          progress,
          error,
          files
        }})}
    </div>
  );
}
