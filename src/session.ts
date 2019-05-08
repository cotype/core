import randomString from "crypto-random-string";
import cookieSession from "cookie-session";

/**
 * Returns a middleware that does the session handling.
 */
export default (opts: { secret?: string; domain?: string }) => {
  // Don't sign session when testing as the http client in Node < 10 does not
  // properly handle multiple set-cookie headers.

  let { secret } = opts;
  const { domain } = opts;

  const signed = process.env.NODE_ENV !== "test";
  if (signed) {
    if (!secret) {
      if (process.env.NODE_ENV === "development") {
        console.info(
          `SESSION_SECRET env not set - using default secret for development.`
        );
        secret = "insecure";
      } else {
        console.info(
          `SESSION_SECRET env not set - generating a random secret for production.`
        );
        console.info(
          `NOTE: Set a secret to keep sessions across server restarts and to allow horizontal scaling.`
        );
        secret = randomString(20);
      }
    }
  }
  return cookieSession({
    name: "session",
    secret,
    signed,
    domain,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  });
};
