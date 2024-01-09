import * as Cotype from "../../typings";
export default function visitModel(model: Cotype.Model | Cotype.ObjectType, visitor: (key: string, field: Cotype.Type) => void): void;
