declare module "@slite/quill-delta-markdown";
declare module "got";
declare module "mudder" {
  export const base62: {
    stringToNumber(s: string): number;
    stringToDigits(s: string): number[];
    digitsToString(s: number[]): string;
    mudder(prev: string, post: string): string[];
  };
}
