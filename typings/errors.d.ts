import { VersionItem } from "./entities";

export type ErrorResponseBody = {
  conflictingRefs?: VersionItem[];
};
