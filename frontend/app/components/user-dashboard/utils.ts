export const fmtNaira = (n: number) =>
  "₦" + Math.round(n).toLocaleString("en-NG");

export const fmtNairaFull = (n: number) =>
  "₦" +
  Number(n).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const pad2 = (n: number) => String(n).padStart(2, "0");
