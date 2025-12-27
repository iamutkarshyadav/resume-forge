"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const zod_1 = require("zod");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const isProduction = process.env.NODE_ENV === "production";
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(["development", "production", "test"]).default("development"),
    PORT: zod_1.z.string().transform((val) => parseInt(val, 10)).default("4000"),
    BASE_URL: zod_1.z.string().url().default("http://localhost:4000"),
    DATABASE_URL: zod_1.z.string().min(1, "DATABASE_URL is required"),
    JWT_ACCESS_TOKEN_SECRET: zod_1.z.string()
        .min(32, "JWT_ACCESS_TOKEN_SECRET must be at least 32 characters")
        .refine((val) => !isProduction || !val.includes("dev-"), "Production JWT_ACCESS_TOKEN_SECRET must not use dev defaults"),
    JWT_REFRESH_TOKEN_SECRET: zod_1.z.string()
        .min(32, "JWT_REFRESH_TOKEN_SECRET must be at least 32 characters")
        .refine((val) => !isProduction || !val.includes("dev-"), "Production JWT_REFRESH_TOKEN_SECRET must not use dev defaults"),
    JWT_ACCESS_TOKEN_EXPIRES_IN: zod_1.z.string().default("15m"),
    JWT_REFRESH_TOKEN_EXPIRES_IN: zod_1.z.string().default("30d"),
    GOOGLE_CLIENT_ID: zod_1.z.string().optional(),
    GOOGLE_CLIENT_SECRET: zod_1.z.string().optional(),
    GOOGLE_CALLBACK_URL: zod_1.z.string().optional(),
    GITHUB_CLIENT_ID: zod_1.z.string().optional(),
    GITHUB_CLIENT_SECRET: zod_1.z.string().optional(),
    GITHUB_CALLBACK_URL: zod_1.z.string().optional(),
    UPLOAD_DIR: zod_1.z.string().default("./uploads"),
    MAX_FILE_SIZE: zod_1.z.string().transform((v) => parseInt(v, 10)).default("5242880"),
    ALLOWED_FILE_TYPES: zod_1.z
        .string()
        .default("application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"),
    RATE_LIMIT_WINDOW_MS: zod_1.z.string().transform((v) => parseInt(v, 10)).default("60000"),
    RATE_LIMIT_MAX: zod_1.z.string().transform((v) => parseInt(v, 10)).default("100"),
    GEMINI_API_KEY: zod_1.z.string().optional(),
    GEMINI_MODEL: zod_1.z.string().default("gemini-2.5-flash")
});
try {
    var env = envSchema.parse(process.env);
    exports.env = env;
}
catch (err) {
    console.error("\n❌ Invalid environment configuration:");
    if (err.errors) {
        err.errors.forEach((e) => {
            console.error(`  - ${e.path.join(".")}: ${e.message}`);
        });
    }
    else {
        console.error(err.message);
    }
    process.exit(1);
}
