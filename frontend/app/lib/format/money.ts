export const koboToNaira = (kobo: number): number => kobo / 100;
export const nairaToKobo = (naira: number): number => Math.round(naira * 100);

const NGN = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

export const formatNGN = (kobo: number): string => NGN.format(koboToNaira(kobo));
