import { Item } from "../../../typings";

type Opts = {
  type: "content" | "settings";
  model?: string;
  field?: string;
};

export default class ReferenceConflictError extends Error {
  type: string | undefined;
  model: string | undefined;
  field: string | undefined;
  refs?: Item[] | object[];

  constructor(opts?: Opts) {
    super("Contents has conflicting references");
    this.type = opts && opts.type;
    this.model = opts && opts.model;
    this.field = opts && opts.field;
  }
}
