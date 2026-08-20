import { z } from "zod";

export const profileSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(80),
  lastName: z.string().trim().min(1, "Last name is required").max(80),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9]{8,15}$/, "Enter a valid phone number"),
});

