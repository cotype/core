"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const url_join_1 = __importDefault(require("url-join"));
const visit_1 = __importStar(require("../model/visit"));
const formatQuillDelta_1 = __importDefault(require("./formatQuillDelta"));
const getRefUrl_1 = __importDefault(require("./getRefUrl"));
function convert({ content, contentRefs, contentModel, allModels, contentFormat = "html", mediaUrl, previewOpts = {} }) {
    /**
     * Converts content-references of type content
     * and reverse-references of type references
     */
    const convertReferences = (ref, field) => {
        if (ref) {
            const convertedRef = "_id" in ref
                ? ref
                : {
                    _id: ref.id,
                    _ref: field.type,
                    _content: ref.model
                };
            // ONLY RELEVANT FOR CONTENT-REFERENCES:
            // Refs can only contain an id but no model,
            // this means the ref is not actually a ref but a string
            const isAbsoluteRef = !convertedRef._content;
            if (isAbsoluteRef) {
                convertedRef._url = convertedRef._id;
                return convertedRef;
            }
            const referencedModel = allModels.find(m => m.name.toLowerCase() === convertedRef._content.toLowerCase());
            // No content for the ref was provided,
            // this means the referenced content does not exists anymore.
            // This happens when content get deleted or is scheduled
            if (!referencedModel) {
                return visit_1.NO_STORE_VALUE;
            }
            // ONLY RELEVANT FOR CONTENT-REFERENCES:
            // For external data sources content references don't exist
            if (referencedModel.external)
                return convertedRef;
            // If the referenced content has no `urlPath`,
            // we don't need to add the `_url`
            if (!referencedModel.urlPath)
                return convertedRef;
            // No content for the ref was provided,
            // this means the referenced content does not exists anymore.
            // This happens when content get deleted or is scheduled
            if (!contentRefs[convertedRef._content] ||
                !contentRefs[convertedRef._content][convertedRef._id]) {
                return visit_1.NO_STORE_VALUE;
            }
            const allRefData = contentRefs[convertedRef._content][convertedRef._id];
            convertedRef._url = (0, getRefUrl_1.default)((allRefData || {}).data, referencedModel.urlPath);
            return convertedRef;
        }
    };
    (0, visit_1.default)(content, contentModel, {
        richtext(delta) {
            if (delta && delta.ops) {
                delta.ops = delta.ops.map(el => {
                    if (el.attributes && el.attributes.link && contentRefs) {
                        const match = /\$intern:([\w]*):([0-9]*)\$/gm.exec(el.attributes.link);
                        if (match) {
                            const model = allModels.find(m => m.name.toLocaleLowerCase() === match[1].toLocaleLowerCase());
                            if (model &&
                                contentRefs[model.name] &&
                                contentRefs[model.name][match[2]]) {
                                const data = contentRefs[model.name][match[2]];
                                if (data && data.data) {
                                    el.attributes.link = (0, getRefUrl_1.default)(data.data, model.urlPath);
                                }
                            }
                            else {
                                el.attributes.link = "";
                            }
                        }
                        else {
                            const mediaMatch = /\$media:([\w\/\.]*)\$/gm.exec(el.attributes.link);
                            if (mediaMatch) {
                                el.attributes.link = (0, url_join_1.default)(mediaUrl, mediaMatch[1]);
                            }
                        }
                    }
                    return el;
                });
            }
            if (contentFormat)
                return (0, formatQuillDelta_1.default)(delta, contentFormat);
        },
        list(list) {
            const { publishedOnly, ignoreSchedule } = previewOpts;
            const visible = (item) => {
                if (!publishedOnly || ignoreSchedule)
                    return true;
                const now = new Date();
                const future = item.visibleFrom && new Date(item.visibleFrom) > now;
                const past = item.visibleUntil && new Date(item.visibleUntil) < now;
                return !(future || past);
            };
            return list && Array.isArray(list)
                ? list
                    .filter(Boolean)
                    .filter(visible)
                    .map(l => {
                    return l.value !== undefined ? l.value : l;
                })
                : [];
        },
        content: convertReferences,
        references(refs, field) {
            if (Array.isArray(refs))
                return refs
                    .map(r => convertReferences(r, field))
                    .filter(r => r !== visit_1.NO_STORE_VALUE);
        },
        media(media) {
            if (media)
                return {
                    _id: media,
                    _ref: "media",
                    _src: (0, url_join_1.default)(mediaUrl, media)
                };
        },
        union(data, field) {
            if (!Object.keys(field.types).includes(data._type))
                return null;
        },
        virtual(_data, field) {
            if (field.get) {
                return field.get(content);
            }
            return undefined;
        }
    });
    return content;
}
exports.default = convert;
//# sourceMappingURL=convert.js.map