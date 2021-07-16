import { Type } from "../../../../typings";
const inputs: any = {};

const id = Symbol("inputs");

export default {
  id,
  register(elements: any) {
    Object.assign(inputs, elements);
  },

  get(t: Type, withI18n: boolean = true) {
    if (withI18n && "i18n" in t && t.i18n) {
      return inputs.i18n;
    }
    const input = "input" in t && t.input;
    return (input && inputs[input]) || inputs[t.type];
  }
};
