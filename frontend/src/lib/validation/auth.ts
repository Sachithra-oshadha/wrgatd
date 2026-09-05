import { z } from "zod";

export const loginSchema = z.object({
    email: z
     .string()
     .min(1, "Email is required")
     .email("Enter a valid email address"),
    password: z
     .string()
     .min(1, "Password is required"),     
})

export type LoginValues = z.infer<typeof loginSchema>;


export const registerSchema = z
  .object({
    first_name: z
      .string()
      .min(1, "First name is required")
      .max(100, "First name is too long"),
    last_name: z
      .string()
      .min(1, "Last name is required")
      .max(100, "Last name is too long"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password is too long"),
    confirm_password: z
      .string()
      .min(1, "Please confirm your password"),
  })
  .refine(
    (values) => values.password === values.confirm_password,
    {
      message: "Passwords do not match",
      path: ["confirm_password"],
    }
  );

export type RegisterValues = z.infer<typeof registerSchema>;