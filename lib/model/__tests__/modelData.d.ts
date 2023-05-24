export declare const model: import("../../../typings").Model;
export declare const data: {
    name: string;
    pos: string;
    slug: string;
    immut: string;
    test: {
        pos2: string;
        field1: number;
        field2: string;
        field3: boolean;
        field4: {
            key: number;
            value: string;
        }[];
        field5: {
            test: string;
        };
    };
    test2: {
        key: number;
        value: string;
    }[];
    empty: never[];
    ref: {
        id: number;
        model: string;
    };
    richText: {
        ops: ({
            insert: string;
            attributes?: undefined;
        } | {
            attributes: {
                link: string;
            };
            insert: string;
        })[];
    };
    contentList: {
        key: number;
        value: {
            id: number;
            model: string;
        };
    }[];
};
