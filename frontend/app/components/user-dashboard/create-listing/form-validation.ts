import { z } from "zod";
import type { CarDetailsValues, GadgetDetailsValues } from "./types";

const required = (label: string) =>
  z.string().trim().min(1, `${label} is required`);

const carDetailsSchema = z.object({
  make: required("Make"),
  model: required("Model"),
  year: z.coerce.number().int().min(1900, "Enter a valid year"),
  colour: required("Colour"),
  registration: required("Registration number"),
  mileage: z.coerce.number().int().min(0, "Enter a valid mileage"),
  condition: required("Condition"),
  faults: z.string(),
  mechanicId: required("Verified mechanic"),
  photoCount: z.number().min(1, "Add at least one photo"),
});

const gadgetDetailsSchema = z.object({
  type: required("Gadget type"),
  brand: required("Brand"),
  model: required("Model"),
  colour: required("Colour"),
  battery: z.union([z.literal(""), z.coerce.number().min(0).max(100)]),
  specs: required("Specifications"),
  usage: required("Usage history"),
  defects: z.string(),
  proofUrl: z.string().url("Upload a proof document"),
  photoCount: z.number().min(1, "Add at least one photo"),
});

const pricingSchema = z.object({
  basePrice: z.number().positive("Enter a base price"),
  holdPercent: z.number().min(10, "Hold must be at least 10%").max(20, "Hold cannot exceed 20%"),
  bidIncrement: z.number().positive("Enter a bid increment"),
  startTime: z
    .string()
    .min(1, "Choose a start time")
    .refine((value) => new Date(value).getTime() > Date.now(), "Start time must be in the future"),
  duration: z.number().int().positive("Duration must be at least one minute"),
});

const messageFor = (result: {
  success: boolean;
  error?: { issues: { message: string }[] };
}) =>
  result.success ? null : result.error?.issues[0]?.message ?? "Check the form";

export const validateCarDetails = (
  values: CarDetailsValues,
  photoCount: number,
) => messageFor(carDetailsSchema.safeParse({ ...values, photoCount }));

export const validateGadgetDetails = (
  values: GadgetDetailsValues,
  proofUrl: string,
  photoCount: number,
) => messageFor(gadgetDetailsSchema.safeParse({ ...values, proofUrl, photoCount }));

export const validatePricing = (values: {
  basePrice: number;
  holdPercent: number;
  bidIncrement: number;
  startTime: string;
  duration: number;
}) => messageFor(pricingSchema.safeParse(values));
