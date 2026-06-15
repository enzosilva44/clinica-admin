import { useEffect, useRef, useState } from "react";
import { HeartHandshake, MessageSquarePlus, Trash2, X, ChevronDown, Info, UserX, UserCheck } from "lucide-react";
import AdminLayout from "../components/AdminLayout";
import adminApi from "../services/api";
import toast from "react-hot-toast";

const RISK_CFG = {
  novo:     { label: "Novo",      bar: "bg-blue-300",    badge: "bg-blue-50 text-blue-600"          },
  saudavel: { label: "Saudável",  bar: "bg-emerald-400", badge: "bg-emerald-50 text-emerald-700"   },
  atencao:  { label: "Atenção",   bar: "bg-amber-400",   badge: "bg-amber-50 text-amber-700"       },
  regular:  { label: "Regular",   bar: "bg-gray-300",    badge: "bg-gray-100 text-gray-600"         },
  risco:    { label: "Em risco",  bar: "bg-red-400",     badge: "bg-red-50 text-red-600"            },
};

const NOTE_TYPES = ["geral", "onboarding", "churn", "upsell", "bug"];

const PLAN_LABELS = { solo: "Solo", clinica: "Clínica", enterprise: "Enterprise", dev: "Dev" };
const PLAN_COLORS = {
  solo: "bg-gray-100 text-gray-600", clinica: "bg-emerald-100 text-emerald-700",
  enterprise: "bg-amber-100 text-amber-700", dev: "bg-purple-100 text-purple-700",
};

function ScorePopover({ clinic: c, cfg }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    if (!open) return;
    function handle(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  const isEarly       = (Date.now() - new Date(c.createdAt)) <= 30 * 86400000;
  const baseScore     = isEarly ? 60 : 100;
  const bonuses       = (c.scoreBreakdown ?? []).filter((b) => b.pts > 0);
  const penalties     = (c.scoreBreakdown ?? []).filter((b) => b.pts < 0);
  const maxPossible   = isEarly ? baseScore + bonuses.reduce((s, b) => s + b.pts, 0) : 100;

  return (
    <div ref={ref} className="relative inline-flex flex-col items-center gap-1">
      <button
        onClick={() => setOpen((v) => !v)}
        className="group flex flex-col items-center gap-1 hover:opacity-80 transition"
      >
        <span className={`text-base font-black ${open ? "text-[#1F4D46]" : "text-[#1F4D46]"} group-hover:underline underline-offset-2`}>
          {c.score}
        </span>
        <div className="w-12 h-1.5 bg-[#F0EBE3] rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${cfg.bar}`} style={{ width: `${c.score}%` }} />
        </div>
      </button>

      {open && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 w-64 bg-white border border-[#E8E0D2] rounded-2xl shadow-2xl p-4">
          {/* Arrow */}
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-r border-b border-[#E8E0D2] rotate-45" />

          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-[#1F4D46]">Detalhamento do score</p>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>{cfg.label}</span>
          </div>

          {/* Base */}
          <div className="flex justify-between text-xs py-1.5 border-b border-[#F0EBE3]">
            <span className="text-gray-500">{isEarly ? "Base (fase early)" : "Base (fase estabelecida)"}</span>
            <span className="font-bold text-[#1F4D46]">{baseScore}</span>
          </div>

          {/* Bonuses */}
          {bonuses.length > 0 && bonuses.map((b, i) => (
            <div key={i} className="flex justify-between text-xs py-1.5 border-b border-[#F0EBE3]">
              <span className="text-gray-600 leading-tight">{b.label}</span>
              <span className="font-semibold text-green-600 shrink-0 ml-2">+{b.pts}</span>
            </div>
          ))}

          {/* Penalties */}
          {penalties.length > 0 && penalties.map((b, i) => (
            <div key={i} className="flex justify-between text-xs py-1.5 border-b border-[#F0EBE3]">
              <span className="text-gray-600 leading-tight">{b.label}</span>
              <span className="font-semibold text-red-500 shrink-0 ml-2">{b.pts}</span>
            </div>
          ))}

          {/* No breakdown */}
          {(c.scoreBreakdown ?? []).length === 0 && (
            <p className="text-xs text-gray-400 py-2 text-center">Nenhuma penalidade — score máximo!</p>
          )}

          {/* Total */}
          <div className="flex justify-between text-sm pt-2 mt-1">
            <span className="font-bold text-[#1F4D46]">Score final</span>
            <span className="font-black text-[#1F4D46]">{c.score} / 100</span>
          </div>

          {/* Progress */}
          <div className="mt-2 h-2 bg-[#F0EBE3] rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${cfg.bar} transition-all`} style={{ width: `${c.score}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}

function relDate(d) {
  if (!d) return "—";
  const diff = Math.floor((Date.now() - new Date(d)) / 86400000);
  if (diff === 0) return "Hoje";
  if (diff === 1) return "Ontem";
  if (diff < 30)  return `${diff}d atrás`;
  if (diff < 365) return `${Math.floor(diff / 30)}m atrás`;
  return `${Math.floor(diff / 365)}a atrás`;
}

export default function CustomerSuccess() {
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [noteForm, setNoteForm] = useState({ content: "", type: "geral" });
  const [savingNote, setSavingNote] = useState(false);
  const [filterRisk, setFilterRisk] = useState("");

  useEffect(() => {
    adminApi.get("/admin/cs")
      .then((res) => setClinics(res.data))
      .catch(() => toast.error("Erro ao carregar CS"))
      .finally(() => setLoading(false));
  }, []);

  async function addNote(clinicId) {
    if (!noteForm.content.trim()) return;
    setSavingNote(true);
    try {
      const res = await adminApi.post("/admin/cs/notes", { clinicId, ...noteForm });
      setClinics((prev) => prev.map((c) =>
        c.id === clinicId ? { ...c, notes: [res.data, ...(c.notes ?? [])] } : c
      ));
      setNoteForm({ content: "", type: "geral" });
      toast.success("Nota adicionada!");
    } catch { toast.error("Erro ao salvar nota."); }
    finally { setSavingNote(false); }
  }

  async function removeNote(clinicId, noteId) {
    try {
      await adminApi.delete(`/admin/cs/notes/${noteId}`);
      setClinics((prev) => prev.map((c) =>
        c.id === clinicId ? { ...c, notes: c.notes.filter((n) => n.id !== noteId) } : c
      ));
    } catch { toast.error("Erro ao remover nota."); }
  }

  const [showScore, setShowScore] = useState(false);

  const onboarding = clinics.filter((c) => !c.canceledAt && (Date.now() - new Date(c.createdAt)) < 30 * 86400000);
  const canceled   = clinics.filter((c) => !!c.canceledAt);
  const active     = clinics.filter((c) => !c.canceledAt);

  const visible    = filterRisk === "onboarding"
    ? onboarding
    : filterRisk === "cancelado"
    ? canceled
    : filterRisk
    ? active.filter((c) => c.riskLevel === filterRisk)
    : active;

  const counts  = { novo: 0, saudavel: 0, atencao: 0, regular: 0, risco: 0 };
  active.forEach((c) => { if (counts[c.riskLevel] !== undefined) counts[c.riskLevel]++; });

  // Churn REAL: clinics que efetivamente cancelaram este mês
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const canceledThisMonth = canceled.filter((c) => new Date(c.canceledAt) >= monthStart);
  const churnBase = clinics.filter((c) => c.plan !== "dev" && (Date.now() - new Date(c.createdAt)) > 30 * 86400000);
  const total     = churnBase.length;
  const churnPct  = total > 0 ? Math.round((canceledThisMonth.length / total) * 100) : 0;
  const churnCfg   = churnPct < 5
    ? { label: "Excelente",  color: "text-emerald-600", bar: "bg-emerald-500", bg: "bg-emerald-50 border-emerald-200" }
    : churnPct < 7
    ? { label: "Razoável",   color: "text-amber-600",   bar: "bg-amber-400",   bg: "bg-amber-50 border-amber-200"     }
    : churnPct < 9
    ? { label: "Ruim",       color: "text-orange-600",  bar: "bg-orange-400",  bg: "bg-orange-50 border-orange-200"   }
    : { label: "Gravíssimo", color: "text-red-600",     bar: "bg-red-500",     bg: "bg-red-50 border-red-300"         };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1F4D46]">Customer Success</h1>
        <p className="text-gray-400 text-sm mt-0.5">Saúde e engajamento das clínicas</p>
      </div>

      {/* Churn bar */}
      {!loading && total === 0 && clinics.length > 0 && (
        <div className="bg-[#F5F1EA] border border-[#D8CDB9] rounded-2xl px-5 py-4 mb-5 text-center">
          <p className="text-sm text-gray-500">Nenhuma clínica com mais de 30 dias de uso ainda.</p>
          <p className="text-xs text-gray-400 mt-0.5">O indicador de churn aparece após o período de onboarding.</p>
        </div>
      )}
      {!loading && total > 0 && (
        <div className={`border rounded-2xl px-5 py-4 mb-5 ${churnCfg.bg}`}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Meta de churn — mês atual</p>
              <p className={`text-2xl font-black mt-0.5 ${churnCfg.color}`}>
                {churnPct}%
                <span className={`ml-2 text-sm font-semibold px-2.5 py-0.5 rounded-full ${churnCfg.color} bg-white/60`}>
                  {churnCfg.label}
                </span>
              </p>
            </div>
            <div className="text-right text-xs text-gray-400">
              <p>Meta: <span className="font-semibold text-emerald-600">&lt; 5%</span></p>
              <p className="mt-0.5">{canceledThisMonth.length} cancelaram de {total} elegíveis</p>
            </div>
          </div>
          <div className="h-2.5 bg-white/60 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${churnCfg.bar}`}
              style={{ width: `${Math.min(churnPct, 100)}%` }}
            />
          </div>
          <div className="flex items-center gap-4 mt-2 text-[10px] text-gray-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> &lt; 5% Excelente</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> 5–7% Razoável</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400 inline-block" /> 7–9% Ruim</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> &gt; 9% Gravíssimo</span>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
        {Object.entries(RISK_CFG).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => setFilterRisk(filterRisk === key ? "" : key)}
            className={`bg-white border rounded-2xl p-4 text-left transition ${filterRisk === key ? "border-[#1F4D46] shadow-sm" : "border-[#E8E0D2] hover:border-[#C2A56B]"}`}
          >
            <p className="text-2xl font-black text-[#1F4D46]">{counts[key]}</p>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full mt-1 inline-block ${cfg.badge}`}>{cfg.label}</span>
          </button>
        ))}
        {/* Onboarding card */}
        <button
          onClick={() => setFilterRisk(filterRisk === "onboarding" ? "" : "onboarding")}
          className={`bg-white border rounded-2xl p-4 text-left transition ${filterRisk === "onboarding" ? "border-[#1F4D46] shadow-sm" : "border-[#E8E0D2] hover:border-[#C2A56B]"}`}
        >
          <p className="text-2xl font-black text-[#1F4D46]">{onboarding.length}</p>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full mt-1 inline-block bg-blue-50 text-blue-600">
            Em onboarding
          </span>
          <p className="text-[10px] text-gray-400 mt-1 leading-tight">&lt; 30 dias de cadastro</p>
        </button>
        {/* Cancelados card */}
        <button
          onClick={() => setFilterRisk(filterRisk === "cancelado" ? "" : "cancelado")}
          className={`bg-white border rounded-2xl p-4 text-left transition ${filterRisk === "cancelado" ? "border-red-400 shadow-sm" : "border-[#E8E0D2] hover:border-red-200"}`}
        >
          <p className="text-2xl font-black text-red-500">{canceled.length}</p>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full mt-1 inline-block bg-red-50 text-red-600">
            Cancelaram
          </span>
          <p className="text-[10px] text-gray-400 mt-1 leading-tight">{canceledThisMonth.length} este mês</p>
        </button>
      </div>

      {/* Score explanation */}
      <div className="mb-5">
        <button
          onClick={() => setShowScore((v) => !v)}
          className="flex items-center gap-2 text-xs text-gray-400 hover:text-[#1F4D46] transition"
        >
          <Info size={13} />
          Como o score de saúde é calculado
          <ChevronDown size={12} className={`transition-transform ${showScore ? "rotate-180" : ""}`} />
        </button>

        {showScore && (
          <div className="mt-3 bg-[#F5F1EA] border border-[#D8CDB9] rounded-2xl p-5">
            <p className="text-xs font-bold text-[#1F4D46] mb-3">Score de saúde — lógica por fase</p>

            {/* Fase: Novo */}
            <div className="mb-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
              <p className="text-xs font-semibold text-blue-700 mb-1">🆕 Novo — &lt; 7 dias</p>
              <p className="text-[11px] text-blue-600">Excluído do score e do churn. Aparece no card "Novo" apenas.</p>
            </div>

            {/* Fase: Early */}
            <div className="mb-3 p-3 bg-amber-50 border border-amber-100 rounded-xl">
              <p className="text-xs font-semibold text-amber-700 mb-2">📈 Early — 7 a 30 dias</p>
              <p className="text-[11px] text-amber-600 mb-2">Começa em <strong>60</strong> (atenção) e sobe com engajamento:</p>
              {[
                { cond: "Tem pacientes cadastrados",  pts: "+15" },
                { cond: "Fez agendamentos",           pts: "+15" },
                { cond: "Login recente (< 7 dias)",   pts: "+10" },
              ].map(({ cond, pts }) => (
                <div key={cond} className="flex justify-between text-[11px] py-1 border-b border-amber-100 last:border-0">
                  <span className="text-gray-600">{cond}</span>
                  <span className="font-semibold text-green-600">{pts}</span>
                </div>
              ))}
            </div>

            {/* Fase: Estabelecida */}
            <div className="mb-4 p-3 bg-[#F5F1EA] border border-[#D8CDB9] rounded-xl">
              <p className="text-xs font-semibold text-[#1F4D46] mb-2">🏢 Estabelecida — &gt; 30 dias</p>
              <p className="text-[11px] text-gray-500 mb-2">Começa em <strong>100</strong>. Penalidades por inatividade:</p>
              {[
                { cond: "0 agendamentos nos últimos 30 dias",    pts: "−40" },
                { cond: "< 3 agendamentos nos últimos 30 dias",  pts: "−20" },
                { cond: "0 agendamentos nos últimos 60 dias",    pts: "−10 adicional" },
                { cond: "Sem login há mais de 30 dias",          pts: "−30" },
                { cond: "Sem login há mais de 14 dias",          pts: "−15" },
              ].map(({ cond, pts }) => (
                <div key={cond} className="flex justify-between text-[11px] py-1 border-b border-[#E8E0D2] last:border-0">
                  <span className="text-gray-600">{cond}</span>
                  <span className="font-semibold text-red-500">{pts}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { range: "80 – 100", label: "Saudável", color: "bg-emerald-50 border-emerald-200 text-emerald-700" },
                { range: "60 – 79",  label: "Regular",  color: "bg-gray-100 border-gray-200 text-gray-600"        },
                { range: "40 – 59",  label: "Atenção",  color: "bg-amber-50 border-amber-200 text-amber-700"      },
                { range: "< 40",     label: "Em risco", color: "bg-red-50 border-red-200 text-red-600"            },
              ].map(({ range, label, color }) => (
                <div key={label} className={`border rounded-xl px-3 py-2 text-center ${color}`}>
                  <p className="font-black text-lg leading-none">{range}</p>
                  <p className="text-xs font-semibold mt-1">{label}</p>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-gray-400 mt-3">
              Churn = cancelamentos reais registrados este mês ÷ base elegível (plano pago, &gt; 30 dias). Onboarding e plano dev são excluídos.
            </p>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-[#E8E0D2] rounded-2xl overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm">Carregando…</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[#F5F1EA] text-xs text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="text-left px-5 py-3">Clínica</th>
                <th className="text-left px-5 py-3">Plano</th>
                <th className="text-center px-5 py-3">Score</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-left px-5 py-3">Últ. login</th>
                <th className="text-left px-5 py-3">Agend. 30d</th>
                <th className="text-center px-5 py-3">Notas</th>
                <th className="px-5 py-3 w-10" />
              </tr>
            </thead>
            <tbody>
              {visible.map((c) => {
                const cfg    = c.canceledAt ? { label: "Cancelado", bar: "bg-gray-300", badge: "bg-gray-100 text-gray-500" } : RISK_CFG[c.riskLevel];
                const isOpen = expanded === c.id;
                const isOnboarding = !c.canceledAt && (Date.now() - new Date(c.createdAt)) < 30 * 86400000;
                return (
                  <>
                    <tr
                      key={c.id}
                      className={`border-t border-[#F0EBE3] hover:bg-[#FDFCFA] transition cursor-pointer group ${isOpen ? "bg-[#FDFCFA]" : ""} ${c.canceledAt ? "opacity-50" : ""}`}
                      onClick={() => setExpanded(isOpen ? null : c.id)}
                    >
                      <td className="px-5 py-3.5 font-medium text-gray-800">
                        <p className="flex items-center gap-1.5">
                          {c.name}
                          {isOnboarding && <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-blue-100 text-blue-600">onboarding</span>}
                        </p>
                        <p className="text-xs text-gray-400">{c.email}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${PLAN_COLORS[c.plan] ?? PLAN_COLORS.solo}`}>
                          {PLAN_LABELS[c.plan] ?? c.plan}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        {c.canceledAt || c.score === null ? (
                          <span className="text-xs text-gray-300">—</span>
                        ) : (
                          <ScorePopover clinic={c} cfg={cfg} />
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <div>
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.badge}`}>{cfg.label}</span>
                          {c.canceledAt && <p className="text-[10px] text-gray-400 mt-0.5">{relDate(c.canceledAt)}</p>}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {c.lastLoginAt ? (
                          <div>
                            <p className="text-xs text-gray-700">{relDate(c.lastLoginAt)}</p>
                            <p className="text-[10px] text-gray-400">{c.loginCount ?? 0} logins total</p>
                          </div>
                        ) : <span className="text-xs text-gray-300">Nunca logou</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        {c.riskLevel === "novo" ? (
                          <span className="text-xs text-gray-300">—</span>
                        ) : (
                          <div>
                            <p className={`text-sm font-bold ${c.aptsLast30 === 0 ? "text-red-500" : c.aptsLast30 < 3 ? "text-amber-500" : "text-[#1F4D46]"}`}>
                              {c.aptsLast30 ?? 0}
                            </p>
                            <p className="text-[10px] text-gray-400">{c.aptsLast60 ?? 0} em 60d</p>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-center text-gray-400 text-xs">{c.notes?.length ?? 0}</td>
                      <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                        {c.canceledAt ? (
                          <button
                            onClick={async () => {
                              const r = await adminApi.patch(`/admin/cs/clinics/${c.id}/reactivate`);
                              setClinics((prev) => prev.map((x) => x.id === c.id ? { ...x, canceledAt: null } : x));
                            }}
                            title="Reativar"
                            className="opacity-0 group-hover:opacity-100 w-7 h-7 bg-green-50 hover:bg-green-100 border border-green-200 text-green-600 rounded-lg flex items-center justify-center transition"
                          >
                            <UserCheck size={12} />
                          </button>
                        ) : (
                          <button
                            onClick={async () => {
                              if (!confirm(`Marcar ${c.name} como cancelado?`)) return;
                              await adminApi.patch(`/admin/cs/clinics/${c.id}/cancel`);
                              setClinics((prev) => prev.map((x) => x.id === c.id ? { ...x, canceledAt: new Date().toISOString() } : x));
                            }}
                            title="Marcar como cancelado"
                            className="opacity-0 group-hover:opacity-100 w-7 h-7 bg-red-50 hover:bg-red-100 border border-red-100 text-red-400 rounded-lg flex items-center justify-center transition"
                          >
                            <UserX size={12} />
                          </button>
                        )}
                      </td>
                    </tr>

                    {/* Notes panel */}
                    {isOpen && (
                      <tr key={`${c.id}-notes`}>
                        <td colSpan={8} className="p-0 bg-[#FDFCFA] border-t border-[#F0EBE3]">
                          <div className="px-5 py-4">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                              <HeartHandshake size={13} /> Notas CS
                            </p>

                            {/* Add note */}
                            <div className="flex gap-2 mb-4">
                              <select
                                value={noteForm.type}
                                onChange={(e) => setNoteForm((f) => ({ ...f, type: e.target.value }))}
                                className="border border-[#D8CDB9] rounded-xl px-3 py-2 text-xs bg-white focus:outline-none shrink-0"
                              >
                                {NOTE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                              </select>
                              <input
                                value={noteForm.content}
                                onChange={(e) => setNoteForm((f) => ({ ...f, content: e.target.value }))}
                                onKeyDown={(e) => e.key === "Enter" && addNote(c.id)}
                                placeholder="Adicionar nota… (Enter para salvar)"
                                className="flex-1 border border-[#D8CDB9] rounded-xl px-3 py-2 text-sm focus:outline-none"
                              />
                              <button
                                onClick={() => addNote(c.id)}
                                disabled={savingNote || !noteForm.content.trim()}
                                className="bg-[#1F4D46] hover:bg-[#285A50] disabled:opacity-40 text-white px-3 py-2 rounded-xl transition"
                              >
                                <MessageSquarePlus size={14} />
                              </button>
                            </div>

                            {/* Notes list */}
                            {(c.notes?.length ?? 0) === 0 ? (
                              <p className="text-xs text-gray-300 text-center py-3">Nenhuma nota ainda.</p>
                            ) : (
                              <div className="space-y-2">
                                {c.notes.map((n) => (
                                  <div key={n.id} className="flex items-start gap-2 bg-white border border-[#E8E0D2] rounded-xl px-3.5 py-2.5">
                                    <span className="text-[10px] bg-[#E8E0D2] text-gray-600 px-2 py-0.5 rounded-full font-medium shrink-0 mt-0.5">{n.type}</span>
                                    <p className="text-sm text-gray-700 flex-1">{n.content}</p>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <span className="text-[10px] text-gray-400">{relDate(n.createdAt)}</span>
                                      <button onClick={() => removeNote(c.id, n.id)} className="text-gray-300 hover:text-red-400 transition">
                                        <X size={12} />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}
