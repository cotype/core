import * as Cotype from "../../typings";
declare const getPositionFields: (model: Cotype.Model) => string[];
export default getPositionFields;
export declare const getPositionFieldsWithValue: (data: any, model: Cotype.Model) => {
    fieldPath: string;
    value: string;
}[];
