"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const acl_1 = require("./acl");
/**
 * Registers the authentication routes (login/logout) as well as
 * a middleware that sets the `request.principal` property.
 */
exports.default = (router, persistence, anonymousPermissions, models) => __awaiter(void 0, void 0, void 0, function* () {
    const { settings } = persistence;
    router.post(`/admin/rest/login`, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { email, password } = req.body;
        const user = yield settings.findUserByEmail(email);
        if (!user)
            return res.status(403).end();
        const valid = yield bcryptjs_1.default.compare(password, user.password);
        if (!valid)
            return res.status(403).end();
        if (!req.session)
            throw new Error("No session middleware");
        req.session.userId = String(user.id);
        req.session.userName = String(user.name);
        res.status(204).end();
    }));
    router.use((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        let user = null;
        if (req.session) {
            const { userId } = req.session;
            if (userId) {
                user = yield settings.loadUser(userId);
                if (user) {
                    // Keep the session alive. See:
                    // https://github.com/expressjs/cookie-session#extending-the-session-expiration
                    req.session.timestamp = Math.floor(Date.now() / 60000);
                }
            }
        }
        req.principal = user || {
            permissions: anonymousPermissions(req)
        };
        next();
    }));
    router.post(`/admin/rest/logout`, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        req.session = undefined;
        res.status(204).end();
    }));
    router.get("/admin/rest/permissions/:type", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { query, params } = req;
        const { sessionID } = query;
        let principal = req.principal;
        if (typeof sessionID === "string") {
            try {
                const buff = Buffer.from(sessionID, "base64");
                const session = JSON.parse(buff.toString("utf-8"));
                const userId = session.userId;
                const user = yield persistence.settings.loadUser(userId);
                if (user) {
                    principal = user;
                }
            }
            catch (e) {
                return res.status(500).json({ error: "Invalid Session" });
            }
        }
        if (!principal) {
            return res.status(403).json({ error: "Forbidden" });
        }
        const model = models.content.find(m => m.name.toLowerCase() === params.type.toLowerCase());
        if (!model) {
            return res.status(404).json({ error: "No such model" });
        }
        res.json({
            view: (0, acl_1.isAllowed)(principal, model, acl_1.Permission.view),
            edit: (0, acl_1.isAllowed)(principal, model, acl_1.Permission.edit),
            publish: (0, acl_1.isAllowed)(principal, model, acl_1.Permission.publish)
        });
    }));
});
//# sourceMappingURL=routes.js.map