"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = exports.model = void 0;
const builder_1 = __importDefault(require("../builder"));
const modelopts = {
    name: "indexContent",
    title: "name",
    orderBy: "pos",
    uniqueFields: ["slug", "test.field5.test"],
    fields: {
        name: {
            type: "string"
        },
        pos: {
            type: "position"
        },
        slug: { type: "string", input: "slug" },
        immut: {
            type: "immutable",
            child: {
                type: "string",
                index: true
            }
        },
        test: {
            type: "object",
            fields: {
                pos2: {
                    type: "position"
                },
                field1: {
                    type: "number",
                    index: true
                },
                field2: {
                    type: "string",
                    index: true
                },
                field3: {
                    type: "boolean",
                    index: true
                },
                field4: {
                    type: "list",
                    item: {
                        type: "string",
                        index: true
                    }
                },
                field5: {
                    type: "object",
                    fields: {
                        test: {
                            type: "string"
                        }
                    }
                }
            }
        },
        test2: {
            type: "list",
            item: {
                type: "string",
                index: true
            }
        },
        empty: {
            type: "list",
            item: {
                type: "string",
                index: true
            }
        },
        ref: {
            type: "content",
            models: ["indexContent"],
            index: true
        },
        richText: {
            type: "richtext"
        },
        contentList: {
            type: "list",
            item: {
                type: "content",
                models: ["indexContent"],
                index: true
            },
        }
    }
};
exports.model = (0, builder_1.default)({ type: "content" })([modelopts])[0];
exports.data = {
    name: "Test",
    pos: "abc",
    slug: "test",
    immut: "test2",
    test: {
        pos2: "abcd",
        field1: 3,
        field2: "test3",
        field3: true,
        field4: [{ key: 0, value: "Hallo" }, { key: 1, value: "Liste" }],
        field5: {
            test: "hallo"
        }
    },
    test2: [{ key: 0, value: "Hallo2" }, { key: 1, value: "Liste2" }],
    empty: [],
    ref: {
        id: 123,
        model: "indexContent"
    },
    richText: {
        ops: [
            { insert: "asd " },
            { attributes: { link: "$intern:indexContent:321$" }, insert: "asd" },
            { insert: " ads" }
        ]
    },
    contentList: [{ key: 0, value: {
                id: 456,
                model: "indexContent"
            } }, { key: 1, value: {
                id: 789,
                model: "indexContent"
            } }, { key: 2, value: {
                id: 123,
                model: "indexContent"
            } }]
};
//# sourceMappingURL=modelData.js.map