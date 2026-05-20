import { z } from "zod";

export const signUpSchema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  email: z.email("Invalid email"),
  phone: z
    .string()
    .min(7, "Enter your phone")
    .regex(/^[0-9 +()-]{7,}$/, "Digits only"),
  password: z.string().min(8, "Min 8 characters"),
  appRole: z.enum(["INDIVIDUAL_BIDDER", "CAR_DEALER", "MECHANIC"]),
  nin: z
    .string()
    .regex(/^\d{11}$/, "11 digits")
    .optional()
    .or(z.literal("")),
  referralCode: z.string().optional().or(z.literal("")),
  accept: z.literal(true, { error: "Accept the terms" }),
});

export type SignUpForm = z.infer<typeof signUpSchema>;

export const signInSchema = z.object({
  email: z.email("Invalid email"),
  password: z.string().min(1, "Required"),
  remember: z.boolean().optional(),
});

export type SignInForm = z.infer<typeof signInSchema>;
