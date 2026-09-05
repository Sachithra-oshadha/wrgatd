import { z } from "zod";

export const projectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Project name is required")
    .max(150, "Project name is too long"),
  description: z
    .string()
    .trim()
    .max(5000, "Description is too long")
    .optional(),
});

export type ProjectValues = z.infer<typeof projectSchema>;
