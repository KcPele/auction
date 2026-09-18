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

export const signInSchema = z
  .object({
    method: z.enum(["email", "phone"]),
    email: z.string(),
    phone: z.string(),
    password: z.string().min(1, "Required"),
    remember: z.boolean().optional(),
  })
  .superRefine((data, context) => {
    if (data.method === "email" && !z.email().safeParse(data.email).success) {
      context.addIssue({
        code: "custom",
        path: ["email"],
        message: "Invalid email",
      });
    }
    if (data.method === "phone" && !/^[0-9 +()-]{7,}$/.test(data.phone)) {
      context.addIssue({
        code: "custom",
        path: ["phone"],
        message: "Enter your phone",
      });
    }
  });

export type SignInForm = z.infer<typeof signInSchema>;
