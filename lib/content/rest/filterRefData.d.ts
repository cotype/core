import * as Cotype from "../../../typings";
export declare const getDeepJoins: (dp: Cotype.Join | undefined, models: Cotype.Model[]) => Cotype.Join[];
export declare const createJoin: (join: Cotype.Join, models: Cotype.Model[]) => Cotype.Join;
export declare const filterContentData: (content: Cotype.Content, join: Cotype.Join) => {
    _id: string;
    _type: string;
};
export declare const getContainingMedia: (content: Cotype.Data, model: Cotype.Model, media: Cotype.MediaRefs) => Cotype.MediaRefs;
export default function (contents: Cotype.Content[], refs: Cotype.Refs, join: Cotype.Join, models: Cotype.Model[]): Cotype.Refs;
