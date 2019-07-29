import proxyMiddleware from "http-proxy-middleware";

export default function getMiddleware(basePath: string = "") {
  return [
    proxyMiddleware("/static", {
      target: `http://localhost:4001`
    }),
    proxyMiddleware("/admin", {
      target: `http://localhost:4001`
    }),
  ];
}
