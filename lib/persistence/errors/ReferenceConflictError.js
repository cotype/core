export default class ReferenceConflictError extends Error {
    constructor(opts) {
        super("Contents has conflicting references");
        this.type = opts && opts.type;
        this.model = opts && opts.model;
        this.field = opts && opts.field;
    }
}
//# sourceMappingURL=ReferenceConflictError.js.map