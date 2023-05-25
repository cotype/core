import { buildInfo } from "../navigationBuilder";
import { createModelFilter } from "../filterModels";
// const someModel = {
//   type: "content",
//   name: "foo",
//   plural: "Foos"
// } as Cotype.Model;
const contentModels = [
    {
        type: "content",
        versioned: true,
        writable: true,
        name: "startPage",
        singular: "Startseite",
        plural: "Startseite",
        collection: "singleton",
        previewUrl: "",
        fields: {},
        title: "title",
        image: undefined
    },
    {
        type: "content",
        versioned: true,
        writable: true,
        name: "contentPages",
        singular: "Contentseite",
        plural: "Contentseiten",
        title: "pagetitle",
        previewUrl: "/contentPages/:slug",
        uniqueFields: [],
        fields: {},
        image: "topImage"
    }
];
const collectionNoneModel = {
    type: "content",
    versioned: false,
    writable: false,
    name: "product",
    collection: "none",
    fields: {},
    external: true,
    plural: "Products",
    singular: "Product",
    title: "id",
    image: undefined
};
const models = {
    content: [],
    settings: [],
    media: {}
};
const principal = {
    id: 1,
    name: "Administrator",
    role: 1,
    picture: null,
    permissions: { settings: true, content: { "*": 7 } }
};
const filter = createModelFilter(principal);
// const defaultGroup = {
//   type: "group",
//   name: "Content",
//   path: "content"
// } as Cotype.NavigationOpts;
describe("navigationBuilder", () => {
    it("builds content navigation from models", () => {
        expect(buildInfo([], Object.assign(Object.assign({}, models), { content: contentModels }), filter)).toEqual({
            modelPaths: {
                content: {
                    contentPages: "/content/contentPages",
                    startPage: "/content/startPage"
                }
            },
            navigation: [
                {
                    items: [
                        {
                            model: "startPage",
                            name: "Startseite",
                            path: "/content/startPage",
                            type: "model"
                        },
                        {
                            model: "contentPages",
                            name: "Contentseiten",
                            path: "/content/contentPages",
                            type: "model"
                        }
                    ],
                    name: "Content",
                    path: "/content",
                    type: "group"
                }
            ]
        });
    });
    it("does not include no-collection models in content", () => {
        expect(buildInfo([], Object.assign(Object.assign({}, models), { content: [...contentModels, collectionNoneModel] }), filter)).toEqual({
            modelPaths: {
                content: {
                    contentPages: "/content/contentPages",
                    startPage: "/content/startPage"
                }
            },
            navigation: [
                {
                    items: [
                        {
                            model: "startPage",
                            name: "Startseite",
                            path: "/content/startPage",
                            type: "model"
                        },
                        {
                            model: "contentPages",
                            name: "Contentseiten",
                            path: "/content/contentPages",
                            type: "model"
                        }
                    ],
                    name: "Content",
                    path: "/content",
                    type: "group"
                }
            ]
        });
    });
    it("does not build content navigation when all models are referenced", () => {
        expect(buildInfo([
            {
                name: "Pages",
                type: "group",
                path: "Page",
                items: [
                    {
                        model: "startPage",
                        name: "Startseite",
                        path: "startPage",
                        type: "model"
                    },
                    {
                        model: "contentPages",
                        name: "Contentseiten",
                        path: "contentPages",
                        type: "model"
                    }
                ]
            }
        ], Object.assign(Object.assign({}, models), { content: contentModels }), filter)).toEqual({
            modelPaths: {
                content: {
                    contentPages: "/Page/contentPages",
                    startPage: "/Page/startPage"
                }
            },
            navigation: [
                {
                    items: [
                        {
                            model: "startPage",
                            name: "Startseite",
                            path: "/Page/startPage",
                            type: "model"
                        },
                        {
                            model: "contentPages",
                            name: "Contentseiten",
                            path: "/Page/contentPages",
                            type: "model"
                        }
                    ],
                    name: "Pages",
                    path: "/Page",
                    type: "group"
                }
            ]
        });
    });
    it("supports custom paths for groups and models", () => {
        expect(buildInfo([
            {
                name: "Pages",
                type: "group",
                path: "CrazyFolder",
                items: [
                    {
                        model: "startPage",
                        name: "Startseite",
                        path: "seiteA",
                        type: "model"
                    },
                    {
                        model: "contentPages",
                        name: "Contentseiten",
                        path: "contentPages",
                        type: "model"
                    }
                ]
            }
        ], Object.assign(Object.assign({}, models), { content: contentModels }), filter)).toEqual({
            modelPaths: {
                content: {
                    contentPages: "/CrazyFolder/contentPages",
                    startPage: "/CrazyFolder/seiteA"
                }
            },
            navigation: [
                {
                    items: [
                        {
                            model: "startPage",
                            name: "Startseite",
                            path: "/CrazyFolder/seiteA",
                            type: "model"
                        },
                        {
                            model: "contentPages",
                            name: "Contentseiten",
                            path: "/CrazyFolder/contentPages",
                            type: "model"
                        }
                    ],
                    name: "Pages",
                    path: "/CrazyFolder",
                    type: "group"
                }
            ]
        });
    });
    it("only adds first group path to models custom path ", () => {
        expect(buildInfo([
            {
                name: "Pages",
                type: "group",
                path: "CrazyFolder",
                items: [
                    {
                        model: "startPage",
                        name: "Startseite",
                        path: "seiteA",
                        type: "model"
                    },
                    {
                        name: "bar",
                        type: "group",
                        path: "otherCrazyFolder",
                        items: [
                            {
                                model: "contentPages",
                                name: "Contentseiten",
                                path: "contentPages",
                                type: "model"
                            }
                        ]
                    },
                    {
                        model: "contentPages",
                        name: "Contentseiten",
                        path: "contentPages",
                        type: "model"
                    }
                ]
            }
        ], Object.assign(Object.assign({}, models), { content: [...contentModels, collectionNoneModel] }), filter)).toEqual({
            modelPaths: {
                content: {
                    contentPages: "/CrazyFolder/contentPages",
                    startPage: "/CrazyFolder/seiteA"
                }
            },
            navigation: [
                {
                    items: [
                        {
                            model: "startPage",
                            name: "Startseite",
                            path: "/CrazyFolder/seiteA",
                            type: "model"
                        },
                        {
                            items: [
                                {
                                    model: "contentPages",
                                    name: "Contentseiten",
                                    path: "/CrazyFolder/contentPages",
                                    type: "model"
                                }
                            ],
                            name: "bar",
                            path: "/CrazyFolder",
                            type: "group"
                        },
                        {
                            model: "contentPages",
                            name: "Contentseiten",
                            path: "/CrazyFolder/contentPages",
                            type: "model"
                        }
                    ],
                    name: "Pages",
                    path: "/CrazyFolder",
                    type: "group"
                }
            ]
        });
    });
    it("fails when no-collection model is referred in navigation", () => {
        expect(() => {
            buildInfo([
                {
                    model: "product",
                    name: "Product",
                    path: "pageA",
                    type: "model"
                }
            ], Object.assign(Object.assign({}, models), { content: contentModels }), filter);
        }).toThrowErrorMatchingInlineSnapshot('"Unknown model \\"product\\" in navigation."');
    });
    // it("fails when group has no items", () => {
    //   expect(() => {
    //     navigationBuilder(
    //       [
    //         {
    //           type: "group",
    //           name: "Baz",
    //           items: []
    //         } as Cotype.NavigationOpts
    //       ],
    //       [someModel],
    //       defaultGroup
    //     );
    //   }).toThrowErrorMatchingInlineSnapshot(
    //     '"Empty groups are not supported. Add some items."'
    //   );
    // });
});
//# sourceMappingURL=navigationBuilder.test.js.map