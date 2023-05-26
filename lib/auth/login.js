"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Express middleware to require a login.
 * Unauthenticated users get a 403.
 */
function default_1(req, res, next) {
    if (!req.principal || !req.principal.id)
        return res.status(403).end();
    next();
}
exports.default = default_1;
//# sourceMappingURL=login.js.map