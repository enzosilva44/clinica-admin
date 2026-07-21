import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Server, Database, TrendingUp, DollarSign, HeartHandshake,
  Megaphone, CheckSquare, ArrowUpRight, ArrowDownRight, AlertTriangle, Gift,
} from "lucide-react";
import AdminLayout from "../components/AdminLayout";
import adminApi from "../services/api";
import toast from "react-hot-toast";

function fmtBRL(n) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(n ?? 0);
}
function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}
function uptimeLabel(sec) {
  if (sec == null) return "—";
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60);
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  if (h >= 1)  return `${h}h ${m}min`;
  return `${m}min`;
}

const HEALTH_CFG = {
  up:           { label: "Operacional", dot: "bg-green-500",  text: "text-green-600",  bg: "bg-green-50"  },
  comprometido: { label: "Comprometido", dot: "bg-amber-500",  text: "text-amber-600",  bg: "bg-amber-50"  },
  down:         { label: "Fora do ar",  dot: "bg-red-500",    text: "text-red-600",    bg: "bg-red-50"    },
};

const PRIORITY_CFG = {
  alta:  { label: "Alta",  color: "bg-red-100 text-red-600"     },
  media: { label: "Média", color: "bg-amber-100 text-amber-600" },
  baixa: { label: "Baixa", color: "bg-gray-100 text-gray-500"   },
};

const LEAD_STATUS_LABELS = {
  novo: "Novos", contato: "Em contato", demo: "Demo", proposta: "Proposta",
  ganho: "Ganhos", perdido: "Perdidos",
};

function scoreColor(s) {
  if (s >= 80) return "text-green-600 bg-green-50";
  if (s >= 60) return "text-emerald-600 bg-emerald-50";
  if (s >= 40) return "text-amber-600 bg-amber-50";
  return "text-red-600 bg-red-50";
}

function HealthCard({ icon: Icon, title, status, detail }) {
  const cfg = HEALTH_CFG[status] ?? HEALTH_CFG.down;
  return (
    <div className="bg-white rounded-2xl p-4 border border-[#E6E2D8] flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cfg.bg}`}>
        <Icon size={18} className={cfg.text} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">{title}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className={`w-2 h-2 rounded-full ${cfg.dot} animate-pulse`} />
          <span className={`text-sm font-bold ${cfg.text}`}>{cfg.label}</span>
        </div>
        {detail && <p className="text-[11px] text-gray-400 mt-0.5">{detail}</p>}
      </div>
    </div>
  );
}

function StatTile({ icon: Icon, label, value, sub, color = "#00704A" }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-[#E6E2D8]">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">{label}</p>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}18` }}>
          <Icon size={14} style={{ color }} />
        </div>
      </div>
      <p className="text-2xl font-black text-[#00704A]">{value}</p>
      {sub && <p className="text-[11px] text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function Panel({ icon: Icon, title, action, children }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E6E2D8] overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[#E6E2D8] flex items-center justify-between">
        <h2 className="text-sm font-bold text-[#00704A] flex items-center gap-2">
          <Icon size={15} /> {title}
        </h2>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function ScoreRow({ clinic }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-gray-700 truncate mr-2">{clinic.name}</span>
      <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${scoreColor(clinic.score)}`}>
        {clinic.score}
      </span>
    </div>
  );
}

export default function Dashboard() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    adminApi.get("/admin/dashboard")
      .then((r) => setData(r.data))
      .catch(() => toast.error("Erro ao carregar o dashboard"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4,5,6,7,8].map((i) => <div key={i} className="h-24 bg-white rounded-2xl animate-pulse border border-[#E6E2D8]" />)}
        </div>
      </AdminLayout>
    );
  }

  const f = data?.financial ?? {};
  const cs = data?.cs ?? {};
  const com = data?.commercial ?? {};
  const health = data?.health ?? {};

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-xl font-black text-[#00704A]">
          Olá{data?.user?.name ? `, ${data.user.name.split(" ")[0]}` : ""} 👋
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">Visão geral do Iasoclin em tempo real.</p>
      </div>

      {/* Saúde do sistema */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <HealthCard
          icon={Server} title="Servidor" status={health.server?.status}
          detail={`Uptime ${uptimeLabel(health.server?.uptimeSec)}`}
        />
        <HealthCard
          icon={Database} title="Banco de dados" status={health.database?.status}
          detail={health.database?.latencyMs != null ? `Latência ${health.database.latencyMs}ms` : "Sem resposta"}
        />
      </div>

      {/* Financeiro */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatTile icon={DollarSign} label="MRR" value={fmtBRL(f.mrr)} sub={`${f.activeClinics ?? 0} clínicas ativas`} />
        <StatTile icon={TrendingUp} label="Caixa" value={fmtBRL(f.caixa)} sub={`${fmtBRL(f.receitas)} rec. / ${fmtBRL(f.despesas)} desp.`} color={f.caixa >= 0 ? "#00704A" : "#DC2626"} />
        <StatTile icon={ArrowUpRight} label="Novas no mês" value={f.newThisMonth ?? 0} sub="clínicas cadastradas" color="#7C3AED" />
        <StatTile icon={Gift} label="Isentas" value={f.exemptCount ?? 0} sub="fora da cobrança" color="#CBA258" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CS */}
        <Panel
          icon={HeartHandshake} title="Customer Success"
          action={<button onClick={() => navigate("/cs")} className="text-xs text-gray-400 hover:text-[#00704A]">ver tudo →</button>}
        >
          <div className="flex items-center gap-4 mb-4 pb-4 border-b border-[#F2F0EB]">
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-semibold">Score médio</p>
              <p className="text-2xl font-black text-[#00704A]">{cs.avgScore ?? "—"}</p>
            </div>
            {cs.atRisk > 0 && (
              <div className="flex items-center gap-1.5 text-red-500 bg-red-50 px-2.5 py-1 rounded-lg">
                <AlertTriangle size={14} />
                <span className="text-xs font-semibold">{cs.atRisk} em risco</span>
              </div>
            )}
          </div>

          <p className="text-[10px] text-gray-400 uppercase font-semibold mb-1 flex items-center gap-1">
            <ArrowUpRight size={11} className="text-green-500" /> Melhores scores
          </p>
          {(cs.top5 ?? []).map((c) => <ScoreRow key={c.id} clinic={c} />)}
          {(cs.top5 ?? []).length === 0 && <p className="text-xs text-gray-300 py-2">Sem dados.</p>}

          <p className="text-[10px] text-gray-400 uppercase font-semibold mb-1 mt-4 flex items-center gap-1">
            <ArrowDownRight size={11} className="text-red-500" /> Piores scores
          </p>
          {(cs.bottom5 ?? []).map((c) => <ScoreRow key={c.id} clinic={c} />)}
          {(cs.bottom5 ?? []).length === 0 && <p className="text-xs text-gray-300 py-2">Sem dados.</p>}
        </Panel>

        {/* Comercial */}
        <Panel
          icon={Megaphone} title="Comercial"
          action={<button onClick={() => navigate("/comercial")} className="text-xs text-gray-400 hover:text-[#00704A]">ver tudo →</button>}
        >
          <div className="flex items-center gap-4 mb-4 pb-4 border-b border-[#F2F0EB]">
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-semibold">Pipeline</p>
              <p className="text-2xl font-black text-[#00704A]">{fmtBRL(com.pipelineValue)}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-semibold">Leads</p>
              <p className="text-2xl font-black text-[#00704A]">{com.total ?? 0}</p>
            </div>
          </div>
          <div className="space-y-1.5">
            {Object.entries(com.byStatus ?? {}).map(([st, n]) => (
              <div key={st} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{LEAD_STATUS_LABELS[st] ?? st}</span>
                <span className="font-semibold text-[#00704A]">{n}</span>
              </div>
            ))}
            {Object.keys(com.byStatus ?? {}).length === 0 && <p className="text-xs text-gray-300">Nenhum lead ainda.</p>}
          </div>
          <p className="text-[11px] text-gray-400 mt-3">+{com.newThisMonth ?? 0} novos este mês</p>
        </Panel>

        {/* Minhas tasks */}
        <Panel
          icon={CheckSquare} title="Minhas demandas"
          action={<button onClick={() => navigate("/tasks")} className="text-xs text-gray-400 hover:text-[#00704A]">ver tudo →</button>}
        >
          <p className="text-xs text-gray-400 mb-3">
            {data?.myTasks?.total ?? 0} tarefa{(data?.myTasks?.total ?? 0) !== 1 ? "s" : ""} em aberto no seu nome — mais antigas primeiro.
          </p>
          <div className="space-y-2">
            {(data?.myTasks?.items ?? []).map((t) => (
              <button
                key={t.id}
                onClick={() => navigate("/tasks")}
                className="w-full text-left flex items-start gap-2 p-2 rounded-xl hover:bg-[#F2F0EB] transition"
              >
                <span className="text-[10px] font-bold text-gray-400 mt-0.5 shrink-0">
                  #{String(t.number ?? 0).padStart(3, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-700 leading-tight truncate">{t.title}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${PRIORITY_CFG[t.priority]?.color}`}>
                      {PRIORITY_CFG[t.priority]?.label}
                    </span>
                    <span className={`text-[10px] ${t.overdue ? "text-red-500 font-semibold" : "text-gray-400"}`}>
                      {t.overdue ? "⏰ " : ""}{fmtDate(t.dueDate)}
                    </span>
                  </div>
                </div>
              </button>
            ))}
            {(data?.myTasks?.items ?? []).length === 0 && (
              <p className="text-xs text-gray-300 py-4 text-center">Nenhuma demanda no seu nome. 🎉</p>
            )}
          </div>
        </Panel>
      </div>
    </AdminLayout>
  );
}
