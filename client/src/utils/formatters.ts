export const sizeFormat = (bytes: number, decimals?: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals || 2;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (
    parseFloat((bytes / Math.pow(k, i)).toFixed(i > 2 ? dm : 0)) +
    " " +
    sizes[i]
  );
};
