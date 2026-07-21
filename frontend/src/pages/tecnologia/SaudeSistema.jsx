import { useEffect, useState } from "react";
import { Server, Database, RefreshCw, Cpu, HardDrive, Activity, Cloud } from "lucide-react";
import AdminLayout from "../../components/AdminLayout";
import adminApi from "../../services/api";
import TecBreadcrumb from "./TecBreadcrumb";
import MiniChart from "./MiniChart";
import toast from "react-hot-toast";

const CFG = {
  up:           { label: "Operacional",  dot: "bg-green-500", text: "text-green-600", bg: "bg-green-50" },
  comprometido: { label: "Comprometido", dot: "bg-amber-500", text: "text-amber-600", bg: "bg-amber-50" },
  down:         { label: "Fora do ar",   dot: "bg-red-500",   text: "text-red-600",   bg: "bg-red-50" },
};

function uptime(sec) {
  if (sec == null) return "—";
  const d = Math.floor(sec / 86400), h = Math.floor((sec % 86400) / 3600), m = Math.floor((sec % 3600) / 60);
  if (d) return `${d}d ${h}h`;
  if (h) return `${h}h ${m}min`;
  return `${m}min`;
}

function StatusCard({ icon: Icon, title, status, rows }) {
  const cfg = CFG[status] ?? CFG.down;
  return (
    <div className="bg-white rounded-2xl border border-[#E6E2D8] overflow-hidden">
      <div className={`px-5 py-4 flex items-center gap-3 ${cfg.bg}`}>
        <Icon size={20} className={cfg.text} />
        <div className="flex-1">
          <p className="text-sm font-bold text-gray-700">{title}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`w-2 h-2 rounded-full ${cfg.dot} animate-pulse`} />
            <span className={`text-xs font-semibold ${cfg.text}`}>{cfg.label}</span>
          </div>
        </div>
      </div>
      <div className="p-5 space-y-2">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between text-sm">
            <span className="text-gray-400">{k}</span>
            <span className="font-semibold text-gray-700">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SaudeSistema() {
  const [data, setData] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [metricsErr, setMetricsErr] = useState(null);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    Promise.all([
      adminApi.get("/admin/health").then((r) => setData(r.data)).catch(() => toast.error("Erro ao verificar saúde do sistema")),
      adminApi.get("/admin/infra/metrics")
        .then((r) => { setMetrics(r.data); setMetricsErr(null); })
        .catch((e) => setMetricsErr(e?.response?.data?.error || "Métricas AWS indisponíveis")),
    ]).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const db = data?.database ?? {};
  const srv = data?.server ?? {};
  const counts = data?.counts ?? {};

  return (
    <AdminLayout>
      <TecBreadcrumb title="Saúde do Sistema" subtitle="Status da infraestrutura em tempo real." />

      <div className="flex justify-end mb-4">
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-[#00704A] border border-[#E6E2D8] rounded-xl px-3 py-2 bg-white transition disabled:opacity-50"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Atualizar
        </button>
      </div>

      {loading && !data ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2].map((i) => <div key={i} className="h-52 bg-white rounded-2xl animate-pulse border border-[#E6E2D8]" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <StatusCard
              icon={Server} title="Servidor (API)" status={srv.status}
              rows={[
                ["Uptime", uptime(srv.uptimeSec)],
                ["Node", srv.nodeVersion ?? "—"],
                ["Ambiente", srv.env ?? "—"],
              ]}
            />
            <StatusCard
              icon={Database} title="Banco de dados" status={db.status}
              rows={[
                ["Latência", db.latencyMs != null ? `${db.latencyMs} ms` : "sem resposta"],
                ["Clínicas", counts.clinics ?? "—"],
                ["Tasks", counts.tasks ?? "—"],
                ["Leads", counts.leads ?? "—"],
              ]}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: HardDrive, label: "Memória (RSS)", value: srv.memoryMB != null ? `${srv.memoryMB} MB` : "—" },
              { icon: Cpu,       label: "Heap usado",    value: srv.heapUsedMB != null ? `${srv.heapUsedMB} MB` : "—" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-white rounded-2xl p-5 border border-[#E6E2D8]">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">{label}</p>
                  <Icon size={14} className="text-gray-300" />
                </div>
                <p className="text-2xl font-black text-[#00704A]">{value}</p>
              </div>
            ))}
          </div>

          {/* Métricas AWS (CloudWatch) — EC2 + RDS */}
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <Cloud size={15} className="text-[#00704A]" />
              <h2 className="text-sm font-bold text-[#00704A]">Métricas AWS (CloudWatch · últimas 3h)</h2>
              {metrics?.ids && (
                <span className="text-[11px] text-gray-400">
                  EC2 {metrics.ids.ec2} · RDS {metrics.ids.rds} · {metrics.ids.region}
                </span>
              )}
            </div>

            {metricsErr ? (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-sm text-amber-700">
                {metricsErr}
              </div>
            ) : metrics ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-4 border border-[#E6E2D8]">
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2 flex items-center gap-1"><Cpu size={12} /> EC2 · CPU</p>
                  <MiniChart series={metrics.ec2?.cpu?.series ?? []} unit="%" color="#00704A" maxHint={100} />
                </div>
                <div className="bg-white rounded-2xl p-4 border border-[#E6E2D8]">
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2 flex items-center gap-1"><Database size={12} /> RDS · CPU</p>
                  <MiniChart series={metrics.rds?.cpu?.series ?? []} unit="%" color="#0EA5E9" maxHint={100} />
                </div>
                <div className="bg-white rounded-2xl p-4 border border-[#E6E2D8]">
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2 flex items-center gap-1"><HardDrive size={12} /> RDS · Mem. livre (MB)</p>
                  <MiniChart series={metrics.rds?.freeMemoryMB?.series ?? []} unit="" color="#7C3AED" />
                </div>
                <div className="bg-white rounded-2xl p-4 border border-[#E6E2D8]">
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2 flex items-center gap-1"><Activity size={12} /> RDS · Conexões</p>
                  <MiniChart series={metrics.rds?.connections?.series ?? []} unit="" color="#CBA258" />
                </div>
              </div>
            ) : (
              <div className="h-40 bg-white rounded-2xl animate-pulse border border-[#E6E2D8]" />
            )}
          </div>

          {data?.checkedAt && (
            <p className="text-[11px] text-gray-400 mt-4 text-right">
              Verificado em {new Date(data.checkedAt).toLocaleString("pt-BR")}
            </p>
          )}
        </>
      )}
    </AdminLayout>
  );
}
