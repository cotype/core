import { Permission } from "../auth/acl";
const { forbidden, view, edit, publish } = Permission;
/**
 * Model definition of the built-in settings entities.
 */
const models = [
    {
        name: "users",
        singular: "User",
        title: "name",
        fields: {
            name: { type: "string", required: true },
            email: {
                type: "string",
                validationRegex: '^(([^<>()\\[\\]\\\\.,;:\\s@"]+(\\.[^<>()\\[\\]\\\\.,;:\\s@"]+)*)|(".+"))@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}])|(([a-zA-Z\\-0-9]+\\.)+[a-zA-Z]{2,}))$',
                regexError: "Has to be a valid e-mail address",
                required: true
            },
            role: { type: "settings", model: "roles", required: true },
            picture: { type: "media" },
            newPassword: { type: "string", label: "Set new password" }
        }
    },
    {
        name: "roles",
        singular: "Role",
        fields: {
            name: { type: "string", required: true },
            permissions: {
                type: "object",
                fields: {
                    settings: { type: "boolean" },
                    preview: { type: "boolean", defaultValue: true },
                    content: {
                        type: "map",
                        keys: {
                            values: ["*"],
                            fetch: "/info/content"
                        },
                        values: {
                            type: "string",
                            input: "select",
                            values: [
                                { label: "forbidden", value: forbidden },
                                { label: "view", value: view },
                                /* tslint:disable-next-line:no-bitwise */
                                { label: "edit", value: view | edit },
                                /* tslint:disable-next-line:no-bitwise */
                                { label: "publish", value: view | edit | publish }
                            ]
                        }
                    }
                }
            }
        }
    }
];
export default models;
//# sourceMappingURL=settings.js.map