export default class HttpError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}
//# sourceMappingURL=HttpError.js.map