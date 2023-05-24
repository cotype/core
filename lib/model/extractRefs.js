"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Recursively walks through a content object and finds all media
 * or content references.
 */
const visit_1 = __importDefault(require("./visit"));
function extractRefs(obj, model, models) {
    const refs = [];
    (0, visit_1.default)(obj, model, {
        richtext(delta) {
            if (delta && delta.ops) {
                delta.ops.forEach(el => {
                    if (el.attributes && el.attributes.link) {
                        const match = /\$intern:([\w]*):([0-9]*)\$/gm.exec(el.attributes.link);
                        if (match) {
                            const refModel = models.find(m => m.name.toLocaleLowerCase() === match[1].toLocaleLowerCase());
                            if (refModel && match[2]) {
                                refs.push({ content: parseInt(match[2], 10), optional: false });
                            }
                        }
                        else {
                            const mediaMatch = /\$media:([\w\/\.]*)\$/gm.exec(el.attributes.link);
                            if (mediaMatch) {
                                refs.push({ media: mediaMatch[1], optional: false });
                            }
                        }
                    }
                });
            }
        },
        media(media, field) {
            if (media && !refs.some(ref => "media" in ref && ref.media === media)) {
                refs.push({ media, optional: !field.required });
            }
        },
        content(content, field, del, fieldPath) {
            if (content) {
                if (!content.model)
                    return;
                // only extract internal refs
                const refModel = models.find(m => m.name.toLowerCase() === content.model.toLowerCase());
                if (!refModel || refModel.external)
                    return;
                const oldRef = refs.find(ref => "content" in ref && ref.content === content.id);
                if (oldRef && oldRef.fieldNames) {
                    // When Ref to this field already exists, add field~
                    oldRef.fieldNames.push(fieldPath);
                }
                else {
                    refs.push({
                        content: content.id,
                        optional: !field.required,
                        fieldNames: [fieldPath]
                    });
                }
            }
        }
    });
    return refs.map(({ fieldNames, ...ref }) => fieldNames ? { fieldNames: fieldNames.join("~"), ...ref } : ref);
}
exports.default = extractRefs;
//# sourceMappingURL=extractRefs.js.map