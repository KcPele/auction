import { z } from "zod";

export const disputeReasonSchema = z
  .string()
  .trim()
  .min(10, "Describe the issue in at least 10 characters")
  .max(1000, "Keep the description under 1,000 characters");
