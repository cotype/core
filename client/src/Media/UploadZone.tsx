import React, { Component, InputHTMLAttributes } from "react";
import { Uploader } from "@navjobs/upload";
import Dropzone from "react-dropzone";
import api from "../api";
import { matchMime, testable } from "../utils/helper";

type Props = {
  render: any;
  onUpload: any;
  className: string;
  activeClass: string;
  multiple?: boolean;
  mediaType?: string;
  mediaFilter?: {
    mimeType?: string;
    maxSize?: number;
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
  };
};

FileList.prototype.every = Array.prototype.every; // Inject Every ArrayMethod to FileList ES6+Polyfill
FileList.prototype.map = Array.prototype.map; // Inject Map ArrayMethod to FileList ES6+Polyfill

declare global {
  interface FileList {
    every(
      callbackfn: (value: File, index: number, array: File[]) => boolean,
      thisArg?: any
    ): boolean;
    map<U>(
      callbackfn: (value: File, index: number, array: File[]) => U,
      thisArg?: any
    ): U[];
  }
}

export default class Upload extends Component<Props> {
  render() {
    const {
      render,
      onUpload,
      className,
      activeClass,
      multiple,
      mediaType,
      mediaFilter
    } = this.props;
    const uploadProps: InputHTMLAttributes<HTMLInputElement> = {};
    return (
      <Uploader
        request={{
          fileName: "file",
          url: `${api.baseURI}/upload`,
          method: "POST",
          withCredentials: true
        }}
        onComplete={({ response, status }: any) => {
          onUpload(response);
        }}
        uploadOnSelection={true}
        uploadProps={uploadProps}
      >
        {(upload: any) => {
          const onFiles = async files => {
            let allowed = true;
            if (mediaType && mediaType !== "all") {
              allowed =
                allowed && files.every(file => file.type.includes(mediaType));
            }
            if (mediaFilter) {
              if (mediaFilter.mimeType) {
                allowed =
                  allowed &&
                  files.every(file =>
                    matchMime(file.type, mediaFilter.mimeType)
                  );
              }
              if (mediaFilter.maxSize) {
                allowed =
                  allowed &&
                  files.every(
                    file =>
                      mediaFilter && file.size < (mediaFilter as any).maxSize
                  );
              }
              if (
                mediaFilter.minHeight ||
                mediaFilter.minWidth ||
                mediaFilter.maxWidth ||
                mediaFilter.maxHeight
              ) {
                const checkedImageSizes = await Promise.all(
                  files.map(
                    file =>
                      new Promise(resolve => {
                        const reader = new FileReader();
                        reader.readAsDataURL(file);
                        reader.onload = (e: any) => {
                          const image = new Image();
                          image.src = e.target.result;
                          image.onload = () => {
                            const height = image.naturalHeight;
                            const width = image.naturalWidth;
                            resolve(
                              !(
                                (mediaFilter.maxWidth &&
                                  mediaFilter.maxWidth < width) ||
                                (mediaFilter.minWidth &&
                                  mediaFilter.minWidth > width) ||
                                (mediaFilter.maxHeight &&
                                  mediaFilter.maxHeight < height) ||
                                (mediaFilter.minHeight &&
                                  mediaFilter.minHeight > height)
                              )
                            );
                          };
                        };
                      })
                  )
                );
                allowed = checkedImageSizes.reduce(
                  (acc, a) => acc && a,
                  allowed
                ) as boolean;
              }
            }

            if (allowed) {
              upload.onFiles(files);
            } else {
              alert("File doesn't match requirements");
            }
          };

          return (
            <Dropzone
              disableClick
              disablePreview
              className={className}
              activeClassName={activeClass}
              onDrop={onFiles}
              multiple={multiple}
              inputProps={uploadProps}
            >
              {render({ ...upload, onFiles })}
            </Dropzone>
          );
        }}
      </Uploader>
    );
  }
}
