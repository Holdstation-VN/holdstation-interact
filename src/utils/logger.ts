export type LoggerOptions = {
  isDebug?: boolean;
  prefix?: string;
};

export type Logger = {
  debug: (message: string, data?: unknown) => void;
  info: (message: string, data?: unknown) => void;
  warn: (message: string, data?: unknown) => void;
  error: (message: string, data?: unknown) => void;
  withOptions: (options?: LoggerOptions) => Logger;
};

export const createLogger = (options: LoggerOptions = {}): Logger => {
  const resolvedOptions: LoggerOptions = {
    isDebug: Boolean(options.isDebug),
    prefix: options.prefix,
  };

  const formatMessage = (message: string) => {
    if (!resolvedOptions.prefix) {
      return message;
    }

    return `[${resolvedOptions.prefix}] ${message}`;
  };

  const log = (level: "debug" | "info" | "warn" | "error", message: string, data?: unknown) => {
    const isGatedLevel = level === "debug" || level === "info";
    if (isGatedLevel && !resolvedOptions.isDebug) {
      return;
    }

    const formattedMessage = formatMessage(message);
    if (data !== undefined) {
      console[level](formattedMessage, data);
      return;
    }

    console[level](formattedMessage);
  };

  const logger: Logger = {
    debug: (message, data) => {
      log("debug", message, data);
    },
    info: (message, data) => {
      log("info", message, data);
    },
    warn: (message, data) => {
      log("warn", message, data);
    },
    error: (message, data) => {
      log("error", message, data);
    },
    withOptions: (nextOptions = {}) => {
      const mergedOptions: LoggerOptions = {
        ...resolvedOptions,
        ...nextOptions,
      };

      return createLogger(mergedOptions);
    },
  };

  return logger;
};
