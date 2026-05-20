const DATE = new Intl.DateTimeFormat("en-NG", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Africa/Lagos",
});

export const formatDate = (iso: string | Date): string =>
  DATE.format(typeof iso === "string" ? new Date(iso) : iso);
