const match = /^.*\/admin/.exec(window.location.pathname);
if (!match) throw new Error("Path for the admin UI must include /admin");

const [basePath] = match;
export default basePath;
