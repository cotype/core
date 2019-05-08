export const hasActuallyErrors = (obj: any) => {
  if (!obj) return false;
  if (typeof obj === "string") {
    return true;
  }

  const t = Object.values(obj)
    .map(hasActuallyErrors)
    .filter(Boolean);

  if (!t.length) {
    return false;
  }
  return true;
};
