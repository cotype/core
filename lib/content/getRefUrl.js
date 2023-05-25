export default function getRefUrl(data, modelUrl) {
    if (!modelUrl)
        return;
    const slugs = modelUrl.match(/\/:([\w|.]*)/gm);
    if (!slugs || slugs.length === 0) {
        return modelUrl;
    }
    let slugURL = modelUrl;
    slugs.forEach(slug => {
        const slugPath = slug.replace("/:", "").split(".");
        // find value from path
        const val = slugPath.reduce((obj, key) => (obj && obj[key] !== "undefined" ? obj[key] : undefined), data);
        slugURL = slugURL.replace(slug, "/" + val);
    });
    return slugURL;
}
//# sourceMappingURL=getRefUrl.js.map