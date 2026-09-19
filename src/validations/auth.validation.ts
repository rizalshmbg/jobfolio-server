import { z } from 'zod';

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters"),

  email: z
    .email('Invalid email address')
    .trim()
    .toLowerCase(),

  password: z
    .string()
    .trim()
    .min(8, "Password must be at least 8 characters")
    .max(64, "Password must be at most 16 characters"),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z
    .email('Invalid email address')
    .trim()
    .toLowerCase(),
  
    password: z
    .string()
    .trim()
    .min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof loginSchema>;
