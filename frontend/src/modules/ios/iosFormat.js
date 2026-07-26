export const STATUS_LABEL = {
  DRAFT: "Rascunho",
  ACTIVE: "Ativo",
  CLOSED: "Encerrado",
  ARCHIVED: "Arquivado",
  AT_RISK: "Em risco",
  COMPLETED: "Concluído",
  CANCELED: "Cancelado",
  ACHIEVED: "Atingido",
  PLANNED: "Planejada",
  IN_PROGRESS: "Em andamento",
  BLOCKED: "Bloqueada",
  PENDING: "Pendente",
  DECIDED: "Decidida",
  REVIEWED: "Revisada",
  REVERSED: "Revertida",
  PUBLISHED: "Publicado",
  PAUSED: "Pausado",
  PROSPECT: "Prospect",
  ENDED: "Encerrado",
  APPROVED: "Aprovado",
  PAID: "Pago",
  RELEASED: "Publicado",
  OPEN: "Aberta",
  FILLED: "Preenchida",
  ON_HOLD: "Em espera",
  CURRENT: "Atual",
};

export const STATUS_STYLE = {
  DRAFT: "bg-gray-100 text-gray-600",
  ACTIVE: "bg-emerald-50 text-emerald-700",
  CLOSED: "bg-slate-100 text-slate-600",
  ARCHIVED: "bg-slate-100 text-slate-500",
  AT_RISK: "bg-amber-50 text-amber-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  CANCELED: "bg-red-50 text-red-600",
  ACHIEVED: "bg-emerald-50 text-emerald-700",
  PLANNED: "bg-sky-50 text-sky-700",
  IN_PROGRESS: "bg-blue-50 text-blue-700",
  BLOCKED: "bg-red-50 text-red-600",
  PENDING: "bg-amber-50 text-amber-700",
  DECIDED: "bg-emerald-50 text-emerald-700",
  REVIEWED: "bg-blue-50 text-blue-700",
  REVERSED: "bg-red-50 text-red-600",
  PUBLISHED: "bg-violet-50 text-violet-700",
  PAUSED: "bg-amber-50 text-amber-700",
  PROSPECT: "bg-sky-50 text-sky-700",
  ENDED: "bg-slate-100 text-slate-600",
  APPROVED: "bg-blue-50 text-blue-700",
  PAID: "bg-emerald-50 text-emerald-700",
  RELEASED: "bg-violet-50 text-violet-700",
  OPEN: "bg-amber-50 text-amber-700",
  FILLED: "bg-emerald-50 text-emerald-700",
  ON_HOLD: "bg-slate-100 text-slate-600",
  CURRENT: "bg-emerald-50 text-emerald-700",
};

const UNIT = {
  NUMBER: "",
  BRL: "R$",
  PERCENTAGE: "%",
  DAYS: "dias",
  MONTHS: "meses",
  SCORE: "pts",
  RATIO: "×",
};

export function fmtDate(value, options = {}) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...options,
  });
}

export function fmtMetric(value, unit) {
  if (value === null || value === undefined || value === "") return "Sem medição";
  const number = Number(value);
  if (!Number.isFinite(number)) return String(value);
  if (unit === "BRL") {
    return number.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }
  const formatted = number.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
  if (unit === "PERCENTAGE") return `${formatted}%`;
  return `${formatted}${UNIT[unit] ? ` ${UNIT[unit]}` : ""}`;
}

export function inputDate(date) {
  if (!date) return "";
  const value = new Date(date);
  return value.toISOString().slice(0, 10);
}

export function currentQuarter() {
  const now = new Date();
  const quarter = Math.floor(now.getMonth() / 3);
  const start = new Date(now.getFullYear(), quarter * 3, 1);
  const end = new Date(now.getFullYear(), quarter * 3 + 3, 0);
  return {
    name: `Q${quarter + 1} ${now.getFullYear()}`,
    startDate: inputDate(start),
    endDate: inputDate(end),
  };
}
