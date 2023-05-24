export type PostHook = (value: any) => any;
export type HookReturnValue = PostHook | void;
export type Hook = (...args: any[]) => HookReturnValue;
export interface Hooks {
    [key: string]: Hook;
}
declare const _default: {
    settings: Hooks;
};
export default _default;
