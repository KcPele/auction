export const fmtNaira = (n: number) => "₦" + n.toLocaleString("en-NG");

export const pad2 = (n: number) => String(n).padStart(2, "0");

export const formatAuctionTime = (s: number) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${pad2(m)}m`;
  return `${pad2(m)}:${pad2(sec)}`;
};
