"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ReferenceConflictError extends Error {
    type;
    model;
    field;
    refs;
    constructor(opts) {
        super("Contents has conflicting references");
        this.type = opts && opts.type;
        this.model = opts && opts.model;
        this.field = opts && opts.field;
    }
}
exports.default = ReferenceConflictError;
//# sourceMappingURL=ReferenceConflictError.js.map