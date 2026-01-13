import { z } from "zod";
import dotenv from "dotenv";
dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().transform((val) => parseInt(val, 10)).default("4000"),
  BASE_URL: z.string().url().default("http://localhost:4000"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_ACCESS_TOKEN_SECRET: z.string()
    .min(32, "JWT_ACCESS_TOKEN_SECRET must be at least 32 characters")
    .refine(
      (val) => !isProduction || !val.includes("dev-"),
      "Production JWT_ACCESS_TOKEN_SECRET must not use dev defaults"
    ),
  JWT_REFRESH_TOKEN_SECRET: z.string()
    .min(32, "JWT_REFRESH_TOKEN_SECRET must be at least 32 characters")
    .refine(
      (val) => !isProduction || !val.includes("dev-"),
      "Production JWT_REFRESH_TOKEN_SECRET must not use dev defaults"
    ),
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
  GEMINI_MODEL: z.string().default("gemini-2.5-flash"),
  STRIPE_SECRET_KEY: z.string().min(1, "STRIPE_SECRET_KEY is required for billing"),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_TEST_WEBHOOK_SECRET: z.string().optional()
});

try {
  var env = envSchema.parse(process.env);
} catch (err: any) {
  console.error("\n❌ Invalid environment configuration:");
  if (err.errors) {
    err.errors.forEach((e: any) => {
      console.error(`  - ${e.path.join(".")}: ${e.message}`);
    });
  } else {
    console.error(err.message);
  }
  process.exit(1);
}

export { env };
