import { Type } from "../../../../typings";
const outputs: any = {};

const id = Symbol("outputs");

export default {
  id,
  register(elements: any) {
    Object.assign(outputs, elements);
  },

  get(t: Type, withI18n: boolean = true) {
    if (withI18n && "i18n" in t && t.i18n) {
      return outputs.i18n;
    }
    const input = "input" in t && t.input;
    return (input && outputs[input]) || outputs[t.type];
  }
};
