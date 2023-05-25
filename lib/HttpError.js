"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class HttpError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}
exports.default = HttpError;
//# sourceMappingURL=HttpError.js.map