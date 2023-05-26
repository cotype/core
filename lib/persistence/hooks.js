"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
function hashUserPassword(model, data) {
    if (model.name === "users" && data.newPassword) {
        data.password = bcryptjs_1.default.hashSync(data.newPassword, 10);
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
exports.default = {
    settings
};
//# sourceMappingURL=hooks.js.map