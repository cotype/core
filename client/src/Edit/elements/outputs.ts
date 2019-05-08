import { Type } from "../../../../typings";
const outputs: any = {};

const id = Symbol("outputs");

export default {
  id,
  register(elements: any) {
    Object.assign(outputs, elements);
  },

  get(t: Type) {
    const input = "input" in t && t.input;
    return (input && outputs[input]) || outputs[t.type];
  }
};
