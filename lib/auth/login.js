/**
 * Express middleware to require a login.
 * Unauthenticated users get a 403.
 */
export default function (req, res, next) {
    if (!req.principal || !req.principal.id)
        return res.status(403).end();
    next();
}
//# sourceMappingURL=login.js.map