/**
 * Helper to provide sensible defaults for model properties
 * that can be deduced from other props or the context.
 */
import * as Cotype from "../../typings";
import changeCase from "change-case";
import pluralize from "pluralize";

export default function modelBuilder(
  props: Cotype.ModelBuilderOpts,
  externalDataSources?: Cotype.ExternalDataSource[]
) {
  const model = (opts: Cotype.ModelOpts): Cotype.Model => {
    const { name, title, readOnly, fields = {} } = opts;

    if (!name) {
      throw new Error("Model must have a `name` property.");
    }
    const singular = opts.singular || changeCase.title(name);
    const plural = opts.plural || pluralize(singular);

    const firstTitleField = Object.keys(fields).find(
      key => fields[key].type === "string"
    );
    const image = Object.keys(fields).find(key => fields[key].type === "media");

    const externalDataProps: {
      writable?: boolean;
      versioned?: boolean;
      external?: boolean;
    } = {};

    if (opts.collection === "iframe") {
      externalDataProps.writable = false;
      externalDataProps.versioned = false;
      externalDataProps.external = false;
      if (!opts.iframeOptions) {
        throw new Error(`IFrame Model "${opts.name}" need "iframeOptions"`);
      }
    }

    if (externalDataSources) {
      const dataSource = externalDataSources.find(
        ({ contentTypes }: Cotype.ExternalDataSource) => {
          return contentTypes.includes(name);
        }
      ) as Cotype.WritableDataSource;
      if (dataSource) {
        externalDataProps.versioned = false;
        externalDataProps.external = true;
        if (typeof dataSource.update === "function") {
          externalDataProps.writable = true;
        } else {
          externalDataProps.writable = false;
        }
      }
    }
    if (readOnly) {
      externalDataProps.versioned = false;
      externalDataProps.writable = false;
    }

    return {
      ...props,
      ...opts,
      ...externalDataProps,
      name,
      plural,
      singular,
      title: title || firstTitleField || "id",
      image,
      fields
    };
  };

  return (defs: Cotype.ModelOpts[]): Cotype.Model[] => defs.map(model);
}
