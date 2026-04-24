export type Strength = 0 | 1 | 2 | 3 | 4;

export interface StrengthInfo {
  score: Strength;
  label: string;
  tone: "weak" | "med" | "strong";
  barClass: string;
  labelColor: string;
}

export function usePasswordStrength(pw: string): StrengthInfo {
  let raw = 0;
  if (pw.length >= 8) raw++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) raw++;
  if (/[0-9]/.test(pw)) raw++;
  if (/[^A-Za-z0-9]/.test(pw)) raw++;
  const score = raw as Strength;

  const tone: StrengthInfo["tone"] = score <= 1 ? "weak" : score <= 2 ? "med" : "strong";
  const label = score <= 1 ? "Weak" : score <= 2 ? "Okay" : "Strong";
  const barClass =
    tone === "weak" ? "bg-red" : tone === "med" ? "bg-accent" : "bg-green";
  const labelColor =
    tone === "weak" ? "text-red" : tone === "med" ? "text-accent" : "text-green";

  return { score, label, tone, barClass, labelColor };
}
