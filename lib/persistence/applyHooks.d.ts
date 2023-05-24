import { Hooks } from "./hooks";
export default function applyHooksFactory(hooks: Hooks): (hookNames: string[], args: any[], action: (...args: any[]) => any) => Promise<any>;
