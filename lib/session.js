"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_random_string_1 = __importDefault(require("crypto-random-string"));
const cookie_session_1 = __importDefault(require("cookie-session"));
const log_1 = __importDefault(require("./log"));
function secret(opts = {}) {
    if (opts.secret) {
        /* Assume user provided everything needed */
        return { secret: opts.secret, signed: true, httpOnly: false };
    }
    // Don't sign session when testing as the http client in Node < 10 does not
    // properly handle multiple set-cookie headers.
    const signed = process.env.NODE_ENV !== "test";
    if (!signed) {
        return { signed: false, secret: undefined, httpOnly: false };
    }
    if (process.env.NODE_ENV === "development") {
        log_1.default.info(`SESSION_SECRET env not set - using default secret for development.`);
        return {
            secret: "insecure",
            signed: true,
            httpOnly: false
        };
    }
    log_1.default.info(`SESSION_SECRET env not set - generating a random secret for production.`);
    log_1.default.info(`NOTE: Set a secret to keep sessions across server restarts and to allow horizontal scaling.`);
    return {
        secret: (0, crypto_random_string_1.default)({ length: 20 }),
        signed: true,
        httpOnly: false
    };
}
/**
 * Returns a middleware that does the session handling.
 */
exports.default = (opts) => {
    return (0, cookie_session_1.default)(Object.assign(Object.assign({ name: "session", maxAge: 24 * 60 * 60 * 1000 }, opts), secret(opts)));
};
//# sourceMappingURL=session.js.map