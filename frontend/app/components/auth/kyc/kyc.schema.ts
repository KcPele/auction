import { z, type ZodType } from "zod";

const identityNumber = z.string().regex(/^\d{11}$/, "Enter exactly 11 digits");
const personName = z.string().trim().min(2, "Enter the registered name");
const birthdate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date of birth");
const phone = z
  .string()
  .trim()
  .regex(/^(?:\+234|0)\d{10}$/, "Enter a valid Nigerian phone number");

export const ninSchema = z.object({
  numberNin: identityNumber,
  surname: personName,
  firstname: personName,
  birthdate,
  telephoneno: phone,
});

export const bvnSchema = z.object({
  number: identityNumber,
  firstName: personName,
  lastName: personName,
  dateOfBirth: birthdate,
  phoneNumber: phone,
});

export const bvnOtpSchema = z.object({
  transactionId: z.string().trim().min(1, "Restart BVN verification"),
  otp: z.string().regex(/^\d{4,6}$/, "Enter the 4–6 digit OTP"),
});

export const subaccountSchema = z.object({
  bvn: identityNumber,
  state: z.string().trim().min(2, "Enter your state"),
  pin: z.string().regex(/^\d{4,6}$/, "Enter a 4–6 digit PIN"),
  address: z.string().trim().min(5, "Enter your full address"),
  business: z.string().trim().max(120, "Business name is too long"),
});

export function firstValidationIssue(schema: ZodType, value: unknown) {
  const result = schema.safeParse(value);
  return result.success ? null : result.error.issues[0]?.message;
}
