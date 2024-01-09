import { ContentWithRefs, Data } from "../../typings";
type Converters = {
    [key: string]: (data: any) => void;
};
export default function refsMerger(data: ContentWithRefs, converters: Converters): {
    visibleFrom?: Date | null | undefined;
    visibleUntil?: Date | null | undefined;
    id: string;
    data: Data;
    type: string;
    author: string;
    date: string | Date;
} | undefined;
export {};
