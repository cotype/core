const models = [
    {
        name: "pages",
        singular: "Page",
        fields: {
            title: { type: "string", label: "Title" },
            body: { type: "string" },
            topNews: { type: "content", models: ["News"] },
            sections: {
                type: "list",
                item: {
                    type: "union",
                    types: {
                        Gallery: {
                            type: "object",
                            fields: {
                                images: {
                                    type: "list",
                                    item: {
                                        type: "media"
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    {
        name: "news",
        singular: "News",
        fields: {
            title: { type: "string" },
            slug: { type: "string", input: "slug" },
            date: { type: "string" },
            image: { type: "media" },
            text: { type: "richtext" }
        }
    },
    {
        name: "products",
        singular: "Product",
        fields: {
            title: { type: "string" },
            ean: { type: "string" },
            brand: { type: "external", models: ["brands"] },
            description: { type: "richtext" },
            image: { type: "media" }
        }
    }
];
export default models;
//# sourceMappingURL=models.js.map