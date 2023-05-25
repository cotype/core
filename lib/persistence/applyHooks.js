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
Object.defineProperty(exports, "__esModule", { value: true });
function applyHooksFactory(hooks) {
    return function applyHooks(hookNames, args, action) {
        return __awaiter(this, void 0, void 0, function* () {
            const applicableHooks = hookNames.map(name => hooks[name]).filter(Boolean);
            const postHooks = yield applicableHooks.reduce((prev, hook) => __awaiter(this, void 0, void 0, function* () {
                const memo = yield prev;
                const post = yield hook(...args);
                if (post) {
                    memo.push(post);
                }
                return memo;
            }), Promise.resolve([]));
            return postHooks.reverse().reduce((prevP, postHook) => __awaiter(this, void 0, void 0, function* () {
                const prev = yield prevP;
                const next = yield postHook(prev);
                return typeof next === "undefined" ? prev : next;
            }), action(...args));
        });
    };
}
exports.default = applyHooksFactory;
//# sourceMappingURL=applyHooks.js.map