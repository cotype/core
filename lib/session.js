import randomString from "crypto-random-string";
import cookieSession from "cookie-session";
import log from "./log";
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
        log.info(`SESSION_SECRET env not set - using default secret for development.`);
        return {
            secret: "insecure",
            signed: true,
            httpOnly: false
        };
    }
    log.info(`SESSION_SECRET env not set - generating a random secret for production.`);
    log.info(`NOTE: Set a secret to keep sessions across server restarts and to allow horizontal scaling.`);
    return {
        secret: randomString({ length: 20 }),
        signed: true,
        httpOnly: false
    };
}
/**
 * Returns a middleware that does the session handling.
 */
export default (opts) => {
    return cookieSession(Object.assign(Object.assign({ name: "session", maxAge: 24 * 60 * 60 * 1000 }, opts), secret(opts)));
};
//# sourceMappingURL=session.js.map