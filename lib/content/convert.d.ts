import { Model, Data, ContentRefs, PreviewOpts, ContentFormat } from "../../typings";
/**
 * Converts a content from its internal representation to a format
 * requested by the client.
 */
type ConvertProps = {
    content: Data;
    contentRefs: ContentRefs;
    contentModel: Model;
    allModels: Model[];
    contentFormat: ContentFormat;
    mediaUrl: string;
    previewOpts?: PreviewOpts;
};
export default function convert({ content, contentRefs, contentModel, allModels, contentFormat, mediaUrl, previewOpts }: ConvertProps): Data;
export {};
