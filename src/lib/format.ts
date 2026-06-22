export const fmtBRL = (n: number | string | null | undefined) => {
  const v = typeof n === "string" ? parseFloat(n) : n ?? 0;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
};

export const fmtCompact = (n: number | string | null | undefined) => {
  const v = typeof n === "string" ? parseFloat(n) : n ?? 0;
  return new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1, style: "currency", currency: "BRL" }).format(v || 0);
};

const parseLocalDate = (dateStr: string) => {
  if (!dateStr) return new Date();
  if (dateStr.includes("T")) {
    return new Date(dateStr);
  }
  const parts = dateStr.split("-").map(Number);
  if (parts.length === 3 && !parts.some(isNaN)) {
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  return new Date(dateStr);
};

export const fmtDate = (d: string | Date) => {
  if (!d) return "";
  const dateObj = typeof d === "string" ? parseLocalDate(d) : d;
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(dateObj);
};

