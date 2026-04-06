type LogLevel = "info" | "warn" | "error" | "debug";

const isProduction = process.env.NODE_ENV === "production";

function formatMessage(level: LogLevel, message: string, meta?: unknown): string {
  const timestamp = new Date().toISOString();
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : "";
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
}

export const logger = {
  info: (message: string, meta?: unknown) => {
    if (!isProduction) {
      console.log(formatMessage("info", message, meta));
    }
  },
  warn: (message: string, meta?: unknown) => {
    console.warn(formatMessage("warn", message, meta));
  },
  error: (message: string, error?: unknown, meta?: unknown) => {
    console.error(formatMessage("error", message, { error, ...((meta as object) ?? {}) }));
  },
  debug: (message: string, meta?: unknown) => {
    if (process.env.LOG_LEVEL === "debug") {
      console.debug(formatMessage("debug", message, meta));
    }
  },
};
