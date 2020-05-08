declare module "@slite/quill-delta-markdown";
declare module "mudder" {
  export const base62: {
    stringToNumber(s: string): number;
    stringToDigits(s: string): number[];
    digitsToString(s: number[]): string;
    mudder(prev: string, post: string): string[];
  };
}

declare module "probe-image-size" {
  const prope: (stream:NodeJS.ReadableStream)=>Promise<{
    width: number,
    height: number,
    type: string, // image 'type' (usual file name extention)
    mime: string,  // mime type
    wUnits: string, // width units type ('px' by default, can be different for SVG)
    hUnits: string, // height units type ('px' by default, can be different for SVG)
  }>
  export default probe
}
