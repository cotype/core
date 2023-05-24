"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function applyHooksFactory(hooks) {
    return async function applyHooks(hookNames, args, action) {
        const applicableHooks = hookNames.map(name => hooks[name]).filter(Boolean);
        const postHooks = await applicableHooks.reduce(async (prev, hook) => {
            const memo = await prev;
            const post = await hook(...args);
            if (post) {
                memo.push(post);
            }
            return memo;
        }, Promise.resolve([]));
        return postHooks.reverse().reduce(async (prevP, postHook) => {
            const prev = await prevP;
            const next = await postHook(prev);
            return typeof next === "undefined" ? prev : next;
        }, action(...args));
    };
}
exports.default = applyHooksFactory;
//# sourceMappingURL=applyHooks.js.map