import randomString from "crypto-random-string";
import cookieSession from "cookie-session";

function secret(
  opts: CookieSessionInterfaces.CookieSessionOptions = {}
): Pick<CookieSessionInterfaces.CookieSessionOptions, "signed" | "secret"> {
  if (opts.secret) {
    /* Assume user provided everything needed */
    return { secret: opts.secret, signed: true };
  }

  // Don't sign session when testing as the http client in Node < 10 does not
  // properly handle multiple set-cookie headers.
  const signed = process.env.NODE_ENV !== "test";

  if (!signed) {
    return { signed: false, secret: undefined };
  }

  if (process.env.NODE_ENV === "development") {
    console.info(
      `SESSION_SECRET env not set - using default secret for development.`
    );
    return {
      secret: "insecure",
      signed: true
    };
  }

  console.info(
    `SESSION_SECRET env not set - generating a random secret for production.`
  );
  console.info(
    `NOTE: Set a secret to keep sessions across server restarts and to allow horizontal scaling.`
  );
  return {
    secret: randomString({ length: 20 }),
    signed: true
  };
}

/**
 * Returns a middleware that does the session handling.
 */
export default (opts?: CookieSessionInterfaces.CookieSessionOptions) => {
  return cookieSession({
    name: "session",
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    ...opts,
    ...secret(opts)
  });
};
