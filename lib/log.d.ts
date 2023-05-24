declare function highlight(text: string | number | boolean, background?: string, color?: string): string | number | boolean;
declare function logo(background?: string, color?: string): string | number | boolean;
declare const _default: {
    debug(...args: any[]): void;
    log(...args: any[]): void;
    warn(...args: any[]): void;
    error(...args: any[]): void;
    info(...args: any[]): void;
    color(background?: string, color?: string): (...args: any[]) => void;
    highlight: typeof highlight;
    logo: typeof logo;
};
export default _default;
