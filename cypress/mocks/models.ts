import { ModelOpts } from "../../typings";

const modelMocks: ModelOpts[] = [
  {
    name: "foos",
    singular: "Foo",
    fields: {
      name: { type: "string",index:true }
    }
  },
  {
    name: "bars",
    singular: "Bar",
    fields: {
      name: { type: "string",index:true }
    }
  },
  {
    name: "bazs",
    singular: "Baz",
    fields: {
      name: { type: "string",index:true }
    }
  },
  {
    name: "quxs",
    singular: "Qux",
    fields: {
      name: { type: "string",index:true }
    }
  }
];

export default function models(amount = 2): ModelOpts[] {
  return modelMocks.slice(0, amount);
}
