"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const title_case_1 = require("title-case");
const pluralize_1 = __importDefault(require("pluralize"));
function modelBuilder(props, externalDataSources) {
    const model = (opts) => {
        const { name, title, readOnly, fields = {} } = opts;
        if (!name) {
            throw new Error("Model must have a `name` property.");
        }
        const singular = opts.singular || (0, title_case_1.titleCase)(name);
        const plural = opts.plural || (0, pluralize_1.default)(singular);
        const firstTitleField = Object.keys(fields).find(key => fields[key].type === "string");
        const image = Object.keys(fields).find(key => fields[key].type === "media");
        const externalDataProps = {};
        if (opts.collection === "iframe") {
            externalDataProps.writable = false;
            externalDataProps.versioned = false;
            externalDataProps.external = false;
            if (!opts.iframeOptions) {
                throw new Error(`IFrame Model "${opts.name}" need "iframeOptions"`);
            }
        }
        if (externalDataSources) {
            const dataSource = externalDataSources.find(({ contentTypes }) => {
                return contentTypes.includes(name);
            });
            if (dataSource) {
                externalDataProps.versioned = false;
                externalDataProps.external = true;
                if (typeof dataSource.update === "function") {
                    externalDataProps.writable = true;
                }
                else {
                    externalDataProps.writable = false;
                }
            }
        }
        if (readOnly) {
            externalDataProps.versioned = false;
            externalDataProps.writable = false;
        }
        return Object.assign(Object.assign(Object.assign(Object.assign({}, props), opts), externalDataProps), { name,
            plural,
            singular, title: title || firstTitleField || "id", image,
            fields });
    };
    return (defs) => defs.map(model);
}
exports.default = modelBuilder;
//# sourceMappingURL=builder.js.map