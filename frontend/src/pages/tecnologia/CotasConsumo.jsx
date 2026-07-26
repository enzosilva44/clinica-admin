import { useEffect, useState } from "react";
import { Gauge, RefreshCw, Bot, MessageCircle, AlertTriangle } from "lucide-react";
import AdminLayout from "../../components/AdminLayout";
import adminApi from "../../services/api";
import TecBreadcrumb from "./TecBreadcrumb";

const RESOURCE_ICON = { ai: Bot, whatsapp: MessageCircle };

const PLAN_COLORS = {
  solo:         "bg-gray-100 text-gray-600",
  essencial:    "bg-sky-100 text-sky-700",
  profissional: "bg-emerald-100 text-emerald-700",
  clinica:      "bg-emerald-100 text-emerald-700",
  enterprise:   "bg-amber-100 text-amber-700",
  dev:          "bg-purple-100 text-purple-700",
};

function fmt(n) {
  return new Intl.NumberFormat("pt-BR").format(n ?? 0);
}

// Cor da barra conforme quão perto do teto (verde → âmbar → vermelho).
function barColor(percent) {
  if (percent == null) return "bg-gray-300";
  if (percent >= 100) return "bg-red-500";
  if (percent >= 80) return "bg-amber-500";
  return "bg-[#00704A]";
}

function UsageBar({ cell }) {
  if (!cell) return <span className="text-gray-300 text-xs">—</span>;
  const { used, limit, topup, percent } = cell;
  const unlimited = limit == null;
  return (
    <div className="min-w-[120px]">
      <div className="flex items-center justify-between text-[11px] mb-1">
        <span className="font-semibold text-gray-700">{fmt(used)}</span>
        <span className="text-gray-400">
          {unlimited ? "ilimitado" : `/ ${fmt(limit + (topup || 0))}`}
          {topup > 0 && <span className="text-[#CBA258]"> (+{fmt(topup)})</span>}
        </span>
      </div>
      {!unlimited && (
        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <div className={`h-full rounded-full transition-all ${barColor(percent)}`} style={{ width: `${Math.min(100, percent ?? 0)}%` }} />
        </div>
      )}
    </div>
  );
}

function TotalCard({ resource, label, unit, total }) {
  const Icon = RESOURCE_ICON[resource] ?? Gauge;
  const cap = (total?.limit ?? 0) + (total?.topup ?? 0);
  const percent = cap > 0 ? Math.min(100, Math.round((total.used / cap) * 100)) : null;
  return (
    <div className="bg-white rounded-2xl border border-[#E6E2D8] p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-xl bg-[#00704A]/10 flex items-center justify-center">
          <Icon size={17} className="text-[#00704A]" />
        </div>
        <span className="text-sm font-bold text-gray-700">{label}</span>
      </div>
      <p className="text-2xl font-black text-[#00704A]">{fmt(total?.used ?? 0)}</p>
      <p className="text-[11px] text-gray-400">
        {unit}s consumidos este mês · teto agregado {fmt(cap)}
        {total?.topup > 0 && <span className="text-[#CBA258]"> · +{fmt(total.topup)} top-up</span>}
      </p>
      {percent != null && (
        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden mt-3">
          <div className={`h-full rounded-full ${barColor(percent)}`} style={{ width: `${percent}%` }} />
        </div>
      )}
    </div>
  );
}

export default function CotasConsumo() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    adminApi.get("/admin/usage")
      .then((r) => { setData(r.data); setErr(null); })
      .catch((e) => setErr(e?.response?.data?.error || "Não foi possível carregar o consumo."))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const resources = data?.resources ?? [];
  const period = data?.periodStart
    ? new Date(data.periodStart).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    : "";

  // Clínicas que estouraram algum recurso, no topo.
  const clinics = (data?.clinics ?? []).slice().sort((a, b) => {
    const over = (c) => resources.some((r) => (c.usage[r.resource]?.percent ?? 0) >= 100);
    return (over(b) ? 1 : 0) - (over(a) ? 1 : 0);
  });

  return (
    <AdminLayout>
      <TecBreadcrumb title="Cotas & Consumo" subtitle={`Consumo de IA e WhatsApp por clínica${period ? ` — ${period}` : ""}.`} />

      <div className="flex justify-end mb-4">
        <button
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl border border-[#E6E2D8] text-gray-600 hover:border-[#00704A]/40 hover:text-[#00704A] transition disabled:opacity-50"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Atualizar
        </button>
      </div>

      {err && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl px-5 py-4 text-sm flex items-center gap-2 mb-4">
          <AlertTriangle size={15} /> {err}
        </div>
      )}

      {/* Totais agregados */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {resources.map((r) => (
          <TotalCard key={r.resource} resource={r.resource} label={r.label} unit={r.unit} total={data?.totals?.[r.resource]} />
        ))}
      </div>

      {/* Por clínica */}
      <div className="bg-white rounded-2xl border border-[#E6E2D8] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#E6E2D8]">
          <span className="text-sm font-bold text-[#00704A]">Consumo por clínica</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase text-gray-400 border-b border-[#F2F0EB]">
                <th className="px-5 py-2.5 font-semibold">Clínica</th>
                <th className="px-5 py-2.5 font-semibold">Plano</th>
                {resources.map((r) => (
                  <th key={r.resource} className="px-5 py-2.5 font-semibold">{r.label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2F0EB]">
              {loading && !data ? (
                <tr><td colSpan={2 + resources.length} className="px-5 py-8 text-center text-gray-400 text-xs">Carregando…</td></tr>
              ) : clinics.length === 0 ? (
                <tr><td colSpan={2 + resources.length} className="px-5 py-8 text-center text-gray-400 text-xs">Nenhuma clínica com consumo neste mês.</td></tr>
              ) : (
                clinics.map((c) => (
                  <tr key={c.id} className="hover:bg-[#FAF9F6]">
                    <td className="px-5 py-3">
                      <p className="font-semibold text-gray-700 truncate max-w-[200px]">{c.name}</p>
                      <p className="text-[11px] text-gray-400 truncate max-w-[200px]">{c.email}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${PLAN_COLORS[c.plan] ?? "bg-gray-100 text-gray-600"}`}>
                        {c.plan}
                      </span>
                    </td>
                    {resources.map((r) => (
                      <td key={r.resource} className="px-5 py-3">
                        <UsageBar cell={c.usage[r.resource]} />
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
