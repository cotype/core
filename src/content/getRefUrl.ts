import { Data } from "../../typings";

export default function getRefUrl(
  data: Data,
  modelUrl?: string | { [langKey: string]: string },
  language?: string
) {
  if (!modelUrl) return;
  const modelURL =
    typeof modelUrl === "string"
      ? modelUrl
      : modelUrl[language || Object.keys(modelUrl)[0]];

  const slugs = modelURL.match(/\/:([\w|.]*)/gm);
  if (!slugs || slugs.length === 0) {
    return modelURL;
  }
  let slugURL = modelURL;
  slugs.forEach(slug => {
    const slugPath = slug.replace("/:", "").split(".");
    // find value from path
    const val = slugPath.reduce(
      (obj, key) => (obj && obj[key] !== "undefined" ? obj[key] : undefined),
      data
    );
    slugURL = slugURL.replace(slug, "/" + val);
  });

  return slugURL;
}
