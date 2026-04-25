export const fmtNGN = (n: number) => "₦" + Number(n).toLocaleString("en-NG");

export const fmtNGNShort = (n: number) => {
  if (n >= 1e9) return "₦" + (n / 1e9).toFixed(1) + "B";
  if (n >= 1e6) return "₦" + (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return "₦" + (n / 1e3).toFixed(0) + "K";
  return "₦" + n;
};

export const pad2 = (n: number) => String(n).padStart(2, "0");

export const fmtDuration = (s: number) => {
  s = Math.max(0, s | 0);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h ? `${h}h ${pad2(m)}m` : `${pad2(m)}:${pad2(sec)}`;
};

export const downloadCSV = (filename: string, rows: (string | number | null | undefined)[][]) => {
  const csv = rows
    .map((r) =>
      r
        .map((c) => {
          const s = String(c ?? "");
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(","),
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
