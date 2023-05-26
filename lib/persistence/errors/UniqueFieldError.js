"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class UniqueFieldError extends Error {
    constructor(nonUniqueFields) {
        super("Content contains unique field conflicts");
        this.nonUniqueFields = nonUniqueFields;
    }
}
exports.default = UniqueFieldError;
//# sourceMappingURL=UniqueFieldError.js.map