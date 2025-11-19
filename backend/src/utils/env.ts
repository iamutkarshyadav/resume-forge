import { z } from "zod";
import dotenv from "dotenv";
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().transform((val) => parseInt(val, 10)).default("4000"),
  BASE_URL: z.string().url().default("http://localhost:4000"),
  DATABASE_URL: z.string().default("mongodb://localhost:27017/resume-dev"),
  JWT_ACCESS_TOKEN_SECRET: z.string().min(20).default("dev-access-secret-please-change-123456"),
  JWT_REFRESH_TOKEN_SECRET: z.string().min(20).default("dev-refresh-secret-please-change-123456"),
  JWT_ACCESS_TOKEN_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_TOKEN_EXPIRES_IN: z.string().default("30d"),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GITHUB_CALLBACK_URL: z.string().optional(),
  UPLOAD_DIR: z.string().default("./uploads"),
  MAX_FILE_SIZE: z.string().transform((v) => parseInt(v, 10)).default("5242880"),
  ALLOWED_FILE_TYPES: z
    .string()
    .default(
      "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
    ),
  RATE_LIMIT_WINDOW_MS: z.string().transform((v) => parseInt(v, 10)).default("60000"),
  RATE_LIMIT_MAX: z.string().transform((v) => parseInt(v, 10)).default("100"),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default("gemini-2.5-flash")
});

export const env = envSchema.parse(process.env);
