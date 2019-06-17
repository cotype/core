import React, { useMemo, useEffect, memo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useUpload } from "react-use-upload";
import createValidator, { MediaFilter } from "./createValidator";
import useValidation from "./useValidation";
import { withMediaInfo } from "../MediaInfoContext";
import { Info, Media } from "../../../typings";
import { XHROptions } from "react-use-upload/cjs/clients/xhr";
import api from "../api";

export type Props = {
  media?: Info["media"];
  render: any;
  onUpload?: (media: Media) => void;
  className: string;
  activeClass: string;
  multiple?: boolean;
  mediaType?: string;
  mediaFilter?: MediaFilter;
};

const noop = () => {
  /* noop */
};

function getUploadConfig(media?: Info["media"]): Partial<XHROptions> {
  if (!media || !media.dynamicUploads) {
    return {
      path: "/upload"
    };
  }

  throw new Error("Implement me");
  // return { getUrl };
}

function usePutFile(done: boolean | undefined, response: any) {
  const [putResponse, setPutResponse] = useState<null | Media>(null);
  useEffect(() => {
    let abort = false;
    if (!done) return;
    api.putMedia(response.response.files).then(files => {
      if (!abort) {
        setPutResponse(files);
      }
    });

    return () => {
      abort = true;
    };
  }, [done, response]);

  return putResponse;
}

function UploadZone({
  media,
  render,
  onUpload,
  className,
  activeClass,
  multiple,
  mediaType,
  mediaFilter
}: Props) {
  const Render = useMemo(() => memo(props => render(props)), [render]);
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
    ...getUploadConfig(media),
    name: "file",
    withCredentials: true
  });
  const newFiles = usePutFile(done, response);
  useEffect(() => {
    if (newFiles) {
      if (onUpload) {
        onUpload(newFiles);
      }
      reset();
    }
  }, [newFiles, reset]);

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
      <Render
        {...{
          ...response,
          complete: done,
          onFiles,
          progress: (progress || 0) * 0.9 + (newFiles ? 0.1 : 0) || undefined,
          error,
          files
        }}
      />
    </div>
  );
}

export default withMediaInfo(UploadZone);
