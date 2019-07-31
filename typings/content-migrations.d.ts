import { Data, MetaData } from "./index";

export type RewriteDataIterator = (
  data: Data,
  meta: MetaData
) => void | Data | Promise<Data>;
