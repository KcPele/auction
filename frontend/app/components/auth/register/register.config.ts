import type { SignUpForm } from "../utils/auth.schema";

export const REGISTER_STEPS: Array<{
  label: string;
  title: string;
  subtitle: string;
  fields: Array<keyof SignUpForm>;
}> = [
  {
    label: "Account",
    title: "Start with the basics.",
    subtitle: "Create the account you will use to bid, buy, or list on BidNaija.",
    fields: ["firstName", "lastName", "email"],
  },
  {
    label: "Profile",
    title: "Build your profile.",
    subtitle: "Tell us how you plan to use the marketplace.",
    fields: ["phone", "appRole", "referralCode"],
  },
  {
    label: "Security",
    title: "Finish securely.",
    subtitle: "Protect your account, then verify your email to continue.",
    fields: ["password", "accept"],
  },
];
