import logger from "./log";
import { Request, Response, NextFunction } from "express";

const speedLog = logger.color("#35feff");

export default function logResponseTime(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (process.env.PERFORMANCE_LOGGING_ENABLED !== "true") return next();

  const startHrTime = process.hrtime();

  res.on("finish", () => {
    const elapsedHrTime = process.hrtime(startHrTime);
    const elapsedTimeInMs = elapsedHrTime[0] * 1000 + elapsedHrTime[1] / 1e6;
    const time = ` ${elapsedTimeInMs} ms `;
    speedLog(
      `Response time for route ${req.path}: ${logger.highlight(time, time)}`
    );
  });

  return next();
}
