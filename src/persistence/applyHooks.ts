import { Hooks, PostHook } from "./hooks";

export default function applyHooksFactory(hooks: Hooks) {
  return async function applyHooks(
    hookNames: string[],
    args: any[],
    action: (...args: any[]) => any
  ) {
    const applicableHooks = hookNames.map(name => hooks[name]).filter(Boolean);

    const postHooks = await applicableHooks.reduce(
      async (prev: Promise<PostHook[]>, hook) => {
        const memo = await prev;
        const post = await hook(...args);

        if (post) {
          memo.push(post);
        }

        return memo;
      },
      Promise.resolve([])
    );

    return postHooks.reverse().reduce(async (prevP, postHook: PostHook) => {
      const prev = await prevP;
      const next = await postHook(prev);

      return typeof next === "undefined" ? prev : next;
    }, action(...args));
  };
}
