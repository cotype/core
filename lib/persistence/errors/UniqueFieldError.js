export default class UniqueFieldError extends Error {
    constructor(nonUniqueFields) {
        super("Content contains unique field conflicts");
        this.nonUniqueFields = nonUniqueFields;
    }
}
//# sourceMappingURL=UniqueFieldError.js.map