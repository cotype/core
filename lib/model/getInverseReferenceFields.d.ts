import * as Cotype from "../../typings";
declare const getInverseReferenceFields: (model: Cotype.Model) => {
    path: string;
    model: string;
    fieldName: string;
}[];
export default getInverseReferenceFields;
