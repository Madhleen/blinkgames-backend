import fs from "fs";
import path from "path";

const logDir = path.resolve("logs");
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

const logFile = path.join(logDir, "server.log");

/**
 * Salva logs com timestamp no arquivo logs/server.log
 */
export function log(message, type = "INFO") {
  const timestamp = new Date().toISOString();
  const logMsg = `[${timestamp}] [${type}] ${message}\n`;
  fs.appendFileSync(logFile, logMsg);
  if (process.env.NODE_ENV !== "production") console.log(logMsg.trim());
}

/**
 * Log de erro com stack trace
 */
export function logError(err) {
  const errorMsg = `[${new Date().toISOString()}] [ERROR] ${err.stack || err.message}\n`;
  fs.appendFileSync(logFile, errorMsg);
  console.error(err);
}
