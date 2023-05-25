import { titleCase } from "title-case";
import pluralize from "pluralize";
export default function modelBuilder(props, externalDataSources) {
    const model = (opts) => {
        const { name, title, readOnly, fields = {} } = opts;
        if (!name) {
            throw new Error("Model must have a `name` property.");
        }
        const singular = opts.singular || titleCase(name);
        const plural = opts.plural || pluralize(singular);
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
//# sourceMappingURL=builder.js.map