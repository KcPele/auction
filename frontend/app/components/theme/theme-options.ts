export const themeOptions = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
] as const;

export const availableThemeNames = themeOptions
  .filter((option) => option.value !== "system")
  .map((option) => option.value);

export type ThemeOption = (typeof themeOptions)[number]["value"];
