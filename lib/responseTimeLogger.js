import logger from "./log";
const speedLog = logger.color("#35feff");
export default function logResponseTime(req, res, next) {
    if (process.env.PERFORMANCE_LOGGING !== "true")
        return next();
    const startTime = Date.now();
    res.on("finish", () => {
        const elapsedTime = Date.now() - startTime;
        const time = `${elapsedTime}ms`;
        speedLog(`Response time for route ${req.path}: ${logger.highlight(time)}.`);
    });
    return next();
}
//# sourceMappingURL=responseTimeLogger.js.map