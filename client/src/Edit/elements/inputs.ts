import { Type } from "../../../../typings";
const inputs: any = {};

const id = Symbol("inputs");

export default {
  id,
  register(elements: any) {
    Object.assign(inputs, elements);
  },

  get(t: Type) {
    const input = "input" in t && t.input;
    return (input && inputs[input]) || inputs[t.type];
  }
};
