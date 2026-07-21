import { useEffect, useState } from "react";
import { Trash2, ArrowRightLeft, SlidersHorizontal, ScrollText, RefreshCw } from "lucide-react";
import AdminLayout from "../../components/AdminLayout";
import adminApi from "../../services/api";
import TecBreadcrumb from "./TecBreadcrumb";
import toast from "react-hot-toast";

const ACTION_CFG = {
  "clinic.delete":   { label: "Excluiu clínica",       icon: Trash2,             color: "text-red-500 bg-red-50" },
  "clinic.plan":     { label: "Alterou plano",          icon: ArrowRightLeft,     color: "text-purple-500 bg-purple-50" },
  "clinic.features": { label: "Alterou features",        icon: SlidersHorizontal,  color: "text-blue-500 bg-blue-50" },
};

const FILTERS = [
  ["", "Todas"],
  ["clinic.delete", "Exclusões"],
  ["clinic.plan", "Planos"],
  ["clinic.features", "Features"],
];

function fmt(d) {
  return new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function detailText(log) {
  const d = log.detail ?? {};
  if (log.action === "clinic.plan" && d.plan) return `→ ${d.plan}`;
  if (log.action === "clinic.delete" && d.email) return d.email;
  if (log.action === "clinic.features") return "customização de features";
  return "";
}

export default function LogsAuditoria() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  function load() {
    setLoading(true);
    adminApi.get("/admin/audit", { params: filter ? { action: filter } : {} })
      .then((r) => setLogs(r.data))
      .catch(() => toast.error("Erro ao carregar logs"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [filter]);

  return (
    <AdminLayout>
      <TecBreadcrumb title="Logs / Auditoria" subtitle="Histórico de ações administrativas." />

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {FILTERS.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filter === key ? "bg-[#00704A] text-white" : "bg-white border border-[#E6E2D8] text-gray-500 hover:border-[#00704A]"}`}
          >
            {label}
          </button>
        ))}
        <button
          onClick={load}
          className="ml-auto flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-[#00704A] border border-[#E6E2D8] rounded-lg px-3 py-1.5 bg-white transition"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Atualizar
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-[#E6E2D8] overflow-hidden">
        {loading && logs.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">Carregando…</div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm flex flex-col items-center gap-2">
            <ScrollText size={28} className="text-gray-200" />
            Nenhuma ação registrada ainda.
          </div>
        ) : (
          <div className="divide-y divide-[#F2F0EB]">
            {logs.map((log) => {
              const cfg = ACTION_CFG[log.action] ?? { label: log.action, icon: ScrollText, color: "text-gray-500 bg-gray-50" };
              const Icon = cfg.icon;
              return (
                <div key={log.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cfg.color}`}>
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold text-[#00704A]">{log.actorName ?? "Admin"}</span>{" "}
                      {cfg.label.toLowerCase()}{" "}
                      {log.targetName && <span className="font-medium">{log.targetName}</span>}{" "}
                      <span className="text-gray-400">{detailText(log)}</span>
                    </p>
                  </div>
                  <span className="text-[11px] text-gray-400 shrink-0">{fmt(log.createdAt)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
