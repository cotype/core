// TODO use existing modules
import { Language } from "../../../typings";

export function formatBytes(bytes: number, decimals?: number) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals || 2;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export function slugify(text: string) {
  const specialChars: any = {
    à: "a",
    ä: "ae",
    á: "a",
    â: "a",
    æ: "a",
    å: "a",
    ë: "e",
    è: "e",
    é: "e",
    ê: "e",
    î: "i",
    ï: "i",
    ì: "i",
    í: "i",
    ò: "o",
    ó: "o",
    ö: "oe",
    ô: "o",
    ø: "o",
    ù: "o",
    ú: "u",
    ü: "ue",
    û: "u",
    ñ: "n",
    ç: "c",
    ß: "s",
    ÿ: "y",
    œ: "o",
    ŕ: "r",
    ś: "s",
    ń: "n",
    ṕ: "p",
    ẃ: "w",
    ǵ: "g",
    ǹ: "n",
    ḿ: "m",
    ǘ: "u",
    ẍ: "x",
    ź: "z",
    ḧ: "h",
    "·": "-",
    "/": "-",
    _: "-",
    ",": "-",
    ":": "-",
    ";": "-"
  };

  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/./g, (target, index, str) => specialChars[target] || target) // Replace special characters using the hash map
    .replace(/&/g, "-and-") // Replace & with 'and'
    .replace(/[^\w-]+/g, "") // Remove all non-word chars
    .replace(/--+/g, "-"); // Replace multiple - with single -
}

const noTestID = {};

export function testable(id) {
  if (
    process.env.NODE_ENV === "production" &&
    !process.env.REACT_APP_TEST_ENV
  ) {
    return noTestID;
  }

  return {
    "data-testid": id
  };
}

export function getPreviewUrl(
  values: object,
  modelUrl: string,
  language?: Language | null
) {
  if (!modelUrl) return;

  const [baseUrl, slug] = modelUrl.split("/:");
  if (!slug) {
    return baseUrl;
  }

  const slugPath = slug.split(".");
  // find value from path
  const slugUrl = slugPath.reduce(
    (obj, key) =>
      obj && obj[key] !== "undefined"
        ? language && typeof obj[key] === 'object' && language.key in obj[key]
          ? obj[key][language.key]
          : obj[key]
        : undefined,
    values
  );

  return `${baseUrl}/${slugUrl}`;
}

export const matchMime = (str, rule) =>
  new RegExp(("^" + rule.split("*").join(".*") + "$").replace("+", "\\+")).test(
    str
  );
