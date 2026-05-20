import { z } from "zod";

export const withdrawalSchema = z.object({
  amountNaira: z
    .number({ error: "Amount required" })
    .positive("Amount must be positive")
    .min(100, "Minimum ₦100")
    .max(5_000_000, "Max ₦5,000,000 per request"),
  destinationBankCode: z.string().min(3, "Bank code required").max(32),
  destinationBankName: z.string().min(2, "Bank required").max(120),
  destinationAccountNumber: z
    .string()
    .regex(/^\d{10}$/, "Must be 10 digits"),
  destinationAccountName: z.string().min(2, "Required").max(160),
  narration: z.string().max(160).optional().or(z.literal("")),
});

export type WithdrawalForm = z.infer<typeof withdrawalSchema>;
