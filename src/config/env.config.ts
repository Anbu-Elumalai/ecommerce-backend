import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  JWT_SECRET: z.string().min(8, "JWT_SECRET must be at least 8 characters long"),
  JWT_EXPIRES_IN: z.string().default("1d"),
  MONGO_URI: z.string().url("MONGO_URI must be a valid MongoDB connection URL"),
  ALLOWED_ORIGINS: z.string().default("*"),

  // Seeding configuration
  SEED_ADMIN_PHONE: z.string().default("9999999999"),
  SEED_ADMIN_PIN: z.string().min(4, "SEED_ADMIN_PIN must be at least 4 characters long").default("9999"),

  // Optional SMS configuration
  SMS_API_KEY: z.string().optional(),
  SMS_SENDER_ID: z.string().optional(),
  SMS_WELCOME_TEMPLATE_ID: z.string().optional(),
  SMS_FORGOT_PIN_TEMPLATE_ID: z.string().optional(),

  // Optional SMTP configuration
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_SECURE: z.coerce.boolean().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM_NAME: z.string().optional(),
  SMTP_FROM_EMAIL: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Environment configuration validation failed:");
  console.error(JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

export const env = parsed.data;
