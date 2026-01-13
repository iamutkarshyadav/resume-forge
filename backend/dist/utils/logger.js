"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.morganMiddleware = void 0;
const morgan_1 = __importDefault(require("morgan"));
exports.morganMiddleware = (0, morgan_1.default)("combined");
exports.logger = {
    info: (message, meta) => {
        console.log(`[INFO] ${message}`, meta ? JSON.stringify(meta) : "");
    },
    error: (message, meta) => {
        console.error(`[ERROR] ${message}`, meta ? JSON.stringify(meta) : "");
    },
    warn: (message, meta) => {
        console.warn(`[WARN] ${message}`, meta ? JSON.stringify(meta) : "");
    },
    debug: (message, meta) => {
        if (process.env.NODE_ENV !== "production") {
            console.debug(`[DEBUG] ${message}`, meta ? JSON.stringify(meta) : "");
        }
    },
};
