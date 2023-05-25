import bcrypt from "bcryptjs";
function hashUserPassword(model, data) {
    if (model.name === "users" && data.newPassword) {
        data.password = bcrypt.hashSync(data.newPassword, 10);
        delete data.newPassword;
    }
}
const settings = {
    onCreate(model, data) {
        hashUserPassword(model, data);
    },
    onSave(model, data) {
        hashUserPassword(model, data);
    }
};
export default {
    settings
};
//# sourceMappingURL=hooks.js.map