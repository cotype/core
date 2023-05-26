"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const log_1 = __importDefault(require("./log"));
const speedLog = log_1.default.color("#35feff");
function logResponseTime(req, res, next) {
    if (process.env.PERFORMANCE_LOGGING !== "true")
        return next();
    const startTime = Date.now();
    res.on("finish", () => {
        const elapsedTime = Date.now() - startTime;
        const time = `${elapsedTime}ms`;
        speedLog(`Response time for route ${req.path}: ${log_1.default.highlight(time)}.`);
    });
    return next();
}
exports.default = logResponseTime;
//# sourceMappingURL=responseTimeLogger.js.map