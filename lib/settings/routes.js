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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Settings routes (/api/settings/*)
 */
const lodash_1 = __importDefault(require("lodash"));
const login_1 = __importDefault(require("../auth/login"));
exports.default = (router, persistence, model) => {
    const { settings } = persistence;
    const { type: modelType, name: modelName, fields, title } = model;
    function getData(obj) {
        return lodash_1.default.pick(obj, Object.keys(fields));
    }
    router.use(`/admin/rest/${modelType}`, login_1.default);
    /** List */
    router.get(`/admin/rest/${modelType}/${modelName}`, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { principal, query } = req;
        const { limit = 50, offset = 0, q } = query;
        let search;
        if (q && title) {
            search = {
                prop: title,
                term: q
            };
        }
        const data = yield settings.list(principal, model, {
            search,
            limit,
            offset
        });
        res.json(data);
    }));
    /** Create */
    router.post(`/admin/rest/${modelType}/${modelName}`, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { principal, body } = req;
        const { data } = body;
        // TODO move to hooks!
        if (modelName === "users") {
            const { email, role, newPassword } = data;
            const missingFields = [];
            if (!email)
                missingFields.push("email");
            if (!role)
                missingFields.push("role");
            if (!newPassword)
                missingFields.push("password");
            if (missingFields.length > 0) {
                let message = "Following fields are missing in order to create a new user: ";
                missingFields.forEach((e, index) => {
                    if (index + 1 === missingFields.length) {
                        message += `${e}!`;
                    }
                    else if (index + 1 === missingFields.length - 1) {
                        message += `${e} and `;
                    }
                    else {
                        message += `${e}, `;
                    }
                });
                return res.status(409).json({ message });
            }
        }
        const id = yield settings.create(principal, model, data);
        res.json({ id, data });
    }));
    /** Load */
    router.get(`/admin/rest/${modelType}/${modelName}/:id`, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { principal, params } = req;
        const record = yield settings.load(principal, model, params.id);
        if (!record)
            return res.status(404).end();
        res.json({ id: record.id, data: getData(record) });
    }));
    /** Load */
    router.get(`/admin/rest/${modelType}/${modelName}/:id/item`, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { principal, params } = req;
        const record = yield settings.loadItem(principal, model, params.id);
        if (!record)
            return res.status(404).end();
        res.json(record);
    }));
    /** Update */
    router.put(`/admin/rest/${modelType}/${modelName}/:id`, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { principal, body } = req;
        const _a = yield settings.update(principal, model, req.params.id, body), { id } = _a, data = __rest(_a, ["id"]);
        res.json({ id, data });
    }));
    /** Delete */
    router.delete(`/admin/rest/${modelType}/${modelName}/:id`, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { principal, params } = req;
        // TODO move to hooks!
        if (modelName === "roles" && principal.role.toString() === params.id) {
            return res.status(409).json({
                message: "You cannot delete a role which is assigned to your account! That would make no sense."
            });
        }
        // TODO move to hooks!
        if (modelName === "users" && principal.id.toString() === params.id) {
            return res.status(409).json({
                message: "You cannot delete your own account! Sorry."
            });
        }
        try {
            yield settings.delete(principal, model, params.id);
            res.status(204).end();
        }
        catch (err) {
            if (err instanceof Error) {
                return res.status(409).json({
                    message: err.message
                });
            }
        }
    }));
};
//# sourceMappingURL=routes.js.map