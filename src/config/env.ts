import dotenv from "dotenv";
import { z } from 'zod';

dotenv.config({
    path:
        process.env.NODE_ENV === "test"
            ? ".env.test"
            : ".env",
});

const envSchema = z.object({
    NODE_ENV: z
        .enum(["development", "test", "production"])
        .default("development"),

    PORT: z.coerce.number().int().positive().default(3000),

    DATABASE_URL: z.string().min(1),

    JWT_SECRET: z.string().min(64, 'JWT_SECRET must be at least 64 characters'),
});

export const env = envSchema.parse(process.env);
