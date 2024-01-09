export default class HttpError extends Error {
    status: number;
    constructor(status: number, message: string);
}
