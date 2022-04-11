import * as Cotype from "../../typings";

import builder from "./builder";
import mediaModels from "./media";
import settingsModels from "./settings";

export default function (
  contentModels: Cotype.ModelOpts[],
  externalDataSource?: Cotype.ExternalDataSource[],
  languages?: Cotype.Language[] | null
): Cotype.Models {
  const content = builder(
    { type: "content", versioned: true, writable: true, languages },
    externalDataSource
  )(contentModels);
  const settings = builder({ type: "settings", writable: true })(
    settingsModels
  );
  const [media] = builder({ type: "media" })(mediaModels);

  return {
    content,
    settings,
    media
  };
}
