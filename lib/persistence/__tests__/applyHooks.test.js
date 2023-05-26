"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const applyHooks_1 = __importDefault(require("../applyHooks"));
describe("applyHooks", () => {
    it("applies hooks", async () => {
        const foo = jest.fn();
        const applyHooks = (0, applyHooks_1.default)({ foo });
        const action = jest.fn();
        await applyHooks(["foo"], ["bar"], action);
        expect(foo).toHaveBeenCalledWith("bar");
        expect(action).toHaveBeenCalledWith("bar");
    });
    it("applies multiple async hooks", async () => {
        let order = "";
        const foo = jest.fn(() => new Promise(resolve => {
            setTimeout(() => {
                order += "1";
                // Note: resolve() -> resolve(true)
                resolve(true);
            }, 1);
        }));
        const bar = jest.fn(() => {
            order += 2;
        });
        const applyHooks = (0, applyHooks_1.default)({ foo, bar });
        const action = jest.fn();
        await applyHooks(["foo", "bar"], ["baz"], action);
        expect(order).toBe("12");
    });
    it("gracefully ignores un-existing hooks", async () => {
        const value = Symbol("value");
        const foo = jest.fn();
        const applyHooks = (0, applyHooks_1.default)({ foo });
        const action = jest.fn(() => value);
        expect(await applyHooks(["baz"], ["bar"], action)).toBe(value);
    });
    it("applies post-hooks", async () => {
        const value1 = Symbol("value");
        const value2 = Symbol("value2");
        const postHook = jest.fn(() => value2);
        const foo = jest.fn(() => postHook);
        const applyHooks = (0, applyHooks_1.default)({ foo });
        const action = jest.fn(() => value1);
        expect(await applyHooks(["foo"], ["bar"], action)).toBe(value2);
        expect(postHook).toHaveBeenCalledWith(value1);
    });
    it("keeps actionValue when postHook returns undefined", async () => {
        const value1 = Symbol("value");
        const postHook = jest.fn();
        const foo = jest.fn(() => postHook);
        const applyHooks = (0, applyHooks_1.default)({ foo });
        const action = jest.fn(() => value1);
        expect(await applyHooks(["foo"], ["bar"], action)).toBe(value1);
    });
    it("applies postHooks async and in reverse order", async () => {
        const state = { order: "" };
        const value = Symbol("value");
        const action = jest.fn(() => value);
        const applyHooks = (0, applyHooks_1.default)({
            foo: s => () => {
                s.order += "3";
            },
            bar: s => () => {
                s.order += "1";
                return new Promise(resolve => {
                    setTimeout(() => {
                        s.order += "2";
                        // Note: resolve() -> resolve(true)
                        resolve(true);
                    }, 1);
                });
            }
        });
        expect(await applyHooks(["foo", "bar"], [state], action)).toBe(value);
        expect(state.order).toBe("123");
    });
});
//# sourceMappingURL=applyHooks.test.js.map