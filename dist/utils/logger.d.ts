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
export declare const createLogger: (options?: LoggerOptions) => Logger;
