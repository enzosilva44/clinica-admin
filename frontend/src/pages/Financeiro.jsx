import { useEffect, useState } from "react";
import {
  TrendingUp, Users, DollarSign, BarChart2,
  ArrowUp, ArrowDown, Plus, Check, X, Clock,
  Trash2, AlertCircle, CreditCard, Building2, Receipt, RefreshCw,
} from "lucide-react";
import AdminLayout from "../components/AdminLayout";
import adminApi from "../services/api";
import { useAdminAuth } from "../contexts/AdminAuthContext";
import toast from "react-hot-toast";

// ── Config ─────────────────────────────────────────────────────────────────────

const PLAN_LABELS      = { solo: "Solo", clinica: "Clínica", enterprise: "Enterprise", dev: "Dev" };
const PLAN_COLORS_BAR  = { solo: "bg-gray-300", clinica: "bg-emerald-400", enterprise: "bg-amber-400", dev: "bg-purple-400" };
const PLAN_BADGE       = { solo: "bg-gray-100 text-gray-600", clinica: "bg-emerald-100 text-emerald-700", enterprise: "bg-amber-100 text-amber-700", dev: "bg-purple-100 text-purple-700" };
const PLAN_MRR         = { solo: 97, clinica: 197, enterprise: 497, dev: 0 };

const DESPESA_CATS = ["Infraestrutura", "Ferramentas", "Marketing", "Pessoal", "Jurídico", "Contabilidade", "Outros"];
const RECEITA_CATS = ["Assinatura Solo", "Assinatura Clínica", "Assinatura Enterprise", "Consultoria", "Outros"];

const STATUS_CFG = {
  pendente:  { label: "Pendente",  color: "bg-amber-100 text-amber-700"  },
  aprovado:  { label: "Aprovado",  color: "bg-green-100 text-green-700"  },
  rejeitado: { label: "Rejeitado", color: "bg-red-100 text-red-600"      },
};

const BILLING_STATUS = {
  pago:     { label: "Pago",     color: "bg-green-100 text-green-700" },
  pendente: { label: "Pendente", color: "bg-amber-100 text-amber-700" },
  isento:   { label: "Isento",   color: "bg-gray-100 text-gray-500"   },
};

const RECORRENCIA_LABELS = { mensal: "Mensal", quinzenal: "Quinzenal", semanal: "Semanal", anual: "Anual" };

const EMPTY_FORM = { type: "despesa", description: "", amount: "", category: "", dueDate: "", notes: "", recorrente: false, recorrencia: "mensal", recorrenciaFim: "" };

function fmtBRL(n) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(n ?? 0);
}
function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtMonth(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function Financeiro() {
  const { adminUser } = useAdminAuth();
  const [tab,          setTab]          = useState("faturamento");
  const [mrr,          setMrr]          = useState(null);
  const [billing,      setBilling]      = useState([]);
  const [entries,      setEntries]      = useState([]);
  const [recorrentes,  setRecorrentes]  = useState([]);
  const [loadingM,     setLoadingM]     = useState(true);
  const [loadingB,     setLoadingB]     = useState(true);
  const [loadingE,     setLoadingE]     = useState(true);
  const [loadingR,     setLoadingR]     = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [saving,   setSaving]   = useState(false);
  const [filterType,   setFilterType]   = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // MRR stats
  useEffect(() => {
    adminApi.get("/admin/financial")
      .then((r) => setMrr(r.data))
      .catch(() => toast.error("Erro ao carregar MRR"))
      .finally(() => setLoadingM(false));
  }, []);

  // Recorrentes
  useEffect(() => {
    adminApi.get("/admin/financial/recorrentes")
      .then((r) => setRecorrentes(r.data))
      .catch(() => {})
      .finally(() => setLoadingR(false));
  }, []);

  // Billing per client (this month)
  useEffect(() => {
    adminApi.get("/admin/financial/billing")
      .then((r) => setBilling(r.data))
      .catch(() => toast.error("Erro ao carregar faturamento"))
      .finally(() => setLoadingB(false));
  }, []);

  // Entries (extrato)
  async function loadEntries() {
    setLoadingE(true);
    try {
      const params = {};
      if (filterType)   params.type   = filterType;
      if (filterStatus) params.status = filterStatus;
      const r = await adminApi.get("/admin/financial/entries", { params });
      setEntries(r.data);
    } catch { toast.error("Erro ao carregar extrato"); }
    finally { setLoadingE(false); }
  }
  useEffect(() => { loadEntries(); }, [filterType, filterStatus]);

  // Confirm payment for a client
  async function confirmPayment(client) {
    try {
      const res = await adminApi.post("/admin/financial/entries", {
        type:          "receita",
        description:   `Assinatura ${PLAN_LABELS[client.plan] ?? client.plan} — ${client.name}`,
        amount:        client.expected,
        category:      `Assinatura ${PLAN_LABELS[client.plan] ?? client.plan}`,
        clinicId:      client.id,
        clinicName:    client.name,
        planType:      client.plan,
        paymentMethod: client.paymentMethod ?? "Não informado",
        status:        "aprovado",
      });
      setBilling((b) => b.map((c) => c.id === client.id ? { ...c, status: "pago", paid: res.data } : c));
      setEntries((e) => [res.data, ...e]);
      toast.success(`Pagamento de ${client.name} confirmado!`);
    } catch { toast.error("Erro ao confirmar."); }
  }

  // Approve / Reject entry
  async function setEntryStatus(id, status) {
    try {
      const res = await adminApi.patch(`/admin/financial/entries/${id}`, { status });
      setEntries((e) => e.map((x) => x.id === id ? res.data : x));
    } catch { toast.error("Erro ao atualizar."); }
  }

  async function removeEntry(id) {
    if (!confirm("Remover?")) return;
    try {
      await adminApi.delete(`/admin/financial/entries/${id}`);
      setEntries((e) => e.filter((x) => x.id !== id));
    } catch { toast.error("Erro."); }
  }

  async function createEntry() {
    if (!form.description.trim()) return toast.error("Descrição obrigatória.");
    if (!form.amount || isNaN(form.amount)) return toast.error("Valor inválido.");
    setSaving(true);
    try {
      const res = await adminApi.post("/admin/financial/entries", form);
      setEntries((e) => [res.data, ...e]);
      setForm(EMPTY_FORM);
      setShowForm(false);
      toast.success("Lançamento criado — aguardando aprovação.");
    } catch { toast.error("Erro ao criar."); }
    finally { setSaving(false); }
  }

  // Summary
  const approved      = entries.filter((e) => e.status === "aprovado");
  const pendingCount  = entries.filter((e) => e.status === "pendente").length;
  const totalReceita  = approved.filter((e) => e.type === "receita").reduce((s, e) => s + e.amount, 0);
  const totalDespesa  = approved.filter((e) => e.type === "despesa").reduce((s, e) => s + e.amount, 0);
  const resultado     = totalReceita - totalDespesa;
  const totalClinics  = mrr?.planBreakdown?.reduce((s, b) => s + b.count, 0) ?? 0;
  const paidCount     = billing.filter((c) => c.status === "pago").length;
  const pendingBill   = billing.filter((c) => c.status === "pendente");
  const expectedTotal = billing.reduce((s, c) => s + c.expected, 0);

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-[#1F4D46]">Financeiro</h1>
          <p className="text-gray-400 text-sm mt-0.5">Faturamento, extrato e MRR</p>
        </div>
        <button
          onClick={() => { setShowForm((v) => !v); setTab("extrato"); }}
          className="bg-[#1F4D46] hover:bg-[#285A50] text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition"
        >
          <Plus size={15} /> Novo lançamento
        </button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-5">
        {[
          { label: "MRR",  value: fmtBRL(mrr?.mrr), sub: "mensalistas confirmados" },
          { label: "ARR",  value: mrr?.arr > 0 ? fmtBRL(mrr?.arr) : "R$ 0", sub: mrr?.arr > 0 ? "contratos anuais" : "nenhum contrato anual ainda",
            color: mrr?.arr > 0 ? "text-emerald-600" : "text-gray-400" },
          { label: "Esperado este mês",  value: fmtBRL(expectedTotal),sub: `${paidCount}/${billing.length} pagos` },
          { label: "Receitas aprovadas", value: fmtBRL(totalReceita), sub: "no extrato"  },
          { label: "Despesas aprovadas", value: fmtBRL(totalDespesa), sub: "no extrato"  },
          { label: "Resultado",          value: fmtBRL(resultado),    sub: resultado >= 0 ? "positivo" : "negativo",
            bold: true, color: resultado >= 0 ? "text-green-600" : "text-red-500" },
        ].map(({ label, value, sub, bold, color }) => (
          <div key={label} className="bg-white border border-[#E8E0D2] rounded-2xl px-4 py-3">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
            <p className={`text-lg font-black ${color ?? "text-[#1F4D46]"}`}>{value}</p>
            <p className="text-[10px] text-gray-400">{sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#F5F1EA] border border-[#D8CDB9] rounded-xl p-1 mb-5 w-fit">
        {[
          ["faturamento", <Building2   size={13} />, "Faturamento"],
          ["extrato",     <Receipt     size={13} />, `Extrato${pendingCount > 0 ? ` (${pendingCount})` : ""}`],
          ["recorrentes", <RefreshCw   size={13} />, `Recorrentes${recorrentes.length > 0 ? ` (${recorrentes.length})` : ""}`],
          ["mrr",         <TrendingUp  size={13} />, "MRR / SaaS"],
        ].map(([key, icon, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition ${tab === key ? "bg-[#1F4D46] text-white" : "text-gray-500 hover:text-[#1F4D46]"}`}
          >
            {icon}{label}
          </button>
        ))}
      </div>

      {/* ── TAB: FATURAMENTO ──────────────────────────────────────────────── */}
      {tab === "faturamento" && (
        <>
          {pendingBill.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mb-4 flex items-center gap-3">
              <AlertCircle size={15} className="text-amber-500 shrink-0" />
              <p className="text-sm text-amber-700 font-medium flex-1">
                {pendingBill.length} cliente{pendingBill.length !== 1 ? "s" : ""} com pagamento pendente este mês
              </p>
            </div>
          )}

          <div className="bg-white border border-[#E8E0D2] rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-[#F0EBE3] flex items-center justify-between bg-[#F5F1EA]">
              <span className="text-sm font-bold text-[#1F4D46]">
                Clínicas — {fmtMonth(new Date())}
              </span>
              <span className="text-xs text-gray-400">{billing.length} clientes · esperado {fmtBRL(expectedTotal)}</span>
            </div>

            {loadingB ? (
              <div className="py-12 text-center text-gray-400 text-sm">Carregando…</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-[#FAFAF9] text-[10px] text-gray-400 uppercase tracking-wide">
                  <tr>
                    <th className="text-left px-5 py-2.5">Clínica</th>
                    <th className="text-left px-5 py-2.5">Plano</th>
                    <th className="text-right px-5 py-2.5">Valor esperado</th>
                    <th className="text-left px-5 py-2.5">Ciclo</th>
                    <th className="text-left px-5 py-2.5">Método pagamento</th>
                    <th className="text-left px-5 py-2.5">Cliente desde</th>
                    <th className="text-center px-5 py-2.5">Status</th>
                    <th className="px-5 py-2.5 w-28" />
                  </tr>
                </thead>
                <tbody>
                  {billing.map((c) => {
                    const bcfg = BILLING_STATUS[c.status] ?? BILLING_STATUS.pendente;
                    return (
                      <tr key={c.id} className="border-t border-[#F0EBE3] hover:bg-[#FDFCFA] transition group">
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-gray-800 leading-tight">{c.name}</p>
                          <p className="text-xs text-gray-400">{c.email}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${PLAN_BADGE[c.plan] ?? PLAN_BADGE.solo}`}>
                            {PLAN_LABELS[c.plan] ?? c.plan}
                          </span>
                        </td>
                        {/* Ciclo toggle */}
                        <td className="px-5 py-3.5">
                          <button
                            onClick={async () => {
                              const next = c.billingCycle === "anual" ? "mensal" : "anual";
                              try {
                                await adminApi.patch(`/admin/financial/billing/${c.id}/cycle`, { billingCycle: next });
                                setBilling((b) => b.map((x) => x.id === c.id ? { ...x, billingCycle: next } : x));
                                toast.success(`Ciclo alterado para ${next}`);
                              } catch { toast.error("Erro ao alterar ciclo."); }
                            }}
                            className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border transition ${
                              c.billingCycle === "anual"
                                ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                                : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
                            }`}
                            title="Clique para alternar"
                          >
                            {c.billingCycle === "anual" ? "Anual" : "Mensal"}
                          </button>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          {c.expected > 0 ? (
                            <div>
                              <span className="font-bold text-[#1F4D46]">{fmtBRL(c.expected)}</span>
                              <p className="text-[10px] text-gray-400">{c.billingCycle === "anual" ? "valor anual" : "/mês"}</p>
                            </div>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          {c.paymentMethod ? (
                            <div className="flex items-center gap-1.5">
                              <CreditCard size={13} className="text-gray-400 shrink-0" />
                              <div>
                                <p className="text-xs font-medium text-gray-700">{c.paymentMethod}</p>
                                {c.cardHolderName && <p className="text-[10px] text-gray-400 truncate max-w-28">{c.cardHolderName}</p>}
                                {c.cardExpiry    && <p className="text-[10px] text-gray-400">vence {c.cardExpiry}</p>}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-300">Não cadastrado</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-gray-400">{fmtDate(c.since)}</td>
                        <td className="px-5 py-3.5 text-center">
                          <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${bcfg.color}`}>
                            {bcfg.label}
                          </span>
                          {c.status === "pago" && c.paid?.createdAt && (
                            <p className="text-[10px] text-gray-400 mt-0.5">{fmtDate(c.paid.createdAt)}</p>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          {c.status === "pendente" && c.expected > 0 && (
                            <button
                              onClick={() => confirmPayment(c)}
                              className="opacity-0 group-hover:opacity-100 transition text-xs bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 ml-auto"
                            >
                              <Check size={11} /> Confirmar
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* ── TAB: EXTRATO ─────────────────────────────────────────────────── */}
      {tab === "extrato" && (
        <>
          {/* New entry form */}
          {showForm && (
            <div className="bg-white border border-[#E8E0D2] rounded-2xl p-5 mb-5">
              <h3 className="text-sm font-bold text-[#1F4D46] mb-4">Novo lançamento</h3>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Tipo</label>
                  <div className="flex bg-[#F5F1EA] border border-[#D8CDB9] rounded-xl p-0.5">
                    {["despesa", "receita"].map((t) => (
                      <button key={t} onClick={() => setForm((f) => ({ ...f, type: t, category: "" }))}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition capitalize ${form.type === t ? (t === "despesa" ? "bg-red-500 text-white" : "bg-green-500 text-white") : "text-gray-500"}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Categoria</label>
                  <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    className="w-full border border-[#D8CDB9] rounded-xl px-3 py-2 text-sm bg-white focus:outline-none">
                    <option value="">Selecionar…</option>
                    {(form.type === "despesa" ? DESPESA_CATS : RECEITA_CATS).map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-gray-400 mb-1 block">Descrição *</label>
                  <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    className="w-full border border-[#D8CDB9] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Valor (R$) *</label>
                  <input type="number" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                    className="w-full border border-[#D8CDB9] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Vencimento</label>
                  <input type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                    className="w-full border border-[#D8CDB9] rounded-xl px-3 py-2 text-sm bg-white focus:outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-gray-400 mb-1 block">Observações</label>
                  <input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    className="w-full border border-[#D8CDB9] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none" />
                </div>

                {/* Recorrência toggle */}
                <div className="col-span-2 border-t border-[#F0EBE3] pt-3">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, recorrente: !f.recorrente }))}
                      className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${form.recorrente ? "bg-[#1F4D46]" : "bg-gray-200"}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${form.recorrente ? "left-5" : "left-0.5"}`} />
                    </button>
                    <div>
                      <span className="text-sm font-medium text-[#1F4D46]">Despesa recorrente</span>
                      <p className="text-[10px] text-gray-400">Gera automaticamente um novo lançamento pendente a cada período</p>
                    </div>
                  </label>

                  {form.recorrente && (
                    <div className="grid grid-cols-2 gap-3 mt-3 pl-0">
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Frequência</label>
                        <select value={form.recorrencia} onChange={(e) => setForm((f) => ({ ...f, recorrencia: e.target.value }))}
                          className="w-full border border-[#D8CDB9] rounded-xl px-3 py-2 text-sm bg-white focus:outline-none">
                          {Object.entries(RECORRENCIA_LABELS).map(([v, l]) => (
                            <option key={v} value={v}>{l}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Encerrar em (opcional)</label>
                        <input type="date" value={form.recorrenciaFim}
                          onChange={(e) => setForm((f) => ({ ...f, recorrenciaFim: e.target.value }))}
                          className="w-full border border-[#D8CDB9] rounded-xl px-3 py-2 text-sm bg-white focus:outline-none" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded-xl transition">Cancelar</button>
                <button onClick={createEntry} disabled={saving}
                  className="bg-[#1F4D46] hover:bg-[#285A50] disabled:opacity-50 text-white px-5 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2">
                  {form.recorrente && <RefreshCw size={13} />}
                  {saving ? "Salvando…" : form.recorrente ? "Criar recorrente" : "Criar lançamento"}
                </button>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex gap-2 mb-4 flex-wrap">
            <div className="flex bg-white border border-[#E8E0D2] rounded-xl p-0.5 text-xs">
              {[["","Todos"],["receita","Receitas"],["despesa","Despesas"]].map(([v,l]) => (
                <button key={v} onClick={() => setFilterType(v)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${filterType===v ? "bg-[#1F4D46] text-white" : "text-gray-500 hover:text-gray-700"}`}>{l}</button>
              ))}
            </div>
            <div className="flex bg-white border border-[#E8E0D2] rounded-xl p-0.5 text-xs">
              {[["","Todos"],["pendente","Pendentes"],["aprovado","Aprovados"],["rejeitado","Rejeitados"]].map(([v,l]) => (
                <button key={v} onClick={() => setFilterStatus(v)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${filterStatus===v ? "bg-[#1F4D46] text-white" : "text-gray-500 hover:text-gray-700"}`}>{l}</button>
              ))}
            </div>
          </div>

          <div className="bg-white border border-[#E8E0D2] rounded-2xl overflow-hidden">
            {loadingE ? (
              <div className="py-12 text-center text-gray-400 text-sm">Carregando…</div>
            ) : entries.length === 0 ? (
              <div className="py-14 text-center text-gray-300 text-sm">Nenhum lançamento.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-[#F5F1EA] text-[10px] text-gray-400 uppercase tracking-wide">
                  <tr>
                    <th className="text-left px-4 py-2.5">Descrição / Clínica</th>
                    <th className="text-left px-4 py-2.5">Plano</th>
                    <th className="text-left px-4 py-2.5">Método</th>
                    <th className="text-right px-4 py-2.5">Valor</th>
                    <th className="text-center px-4 py-2.5">Status</th>
                    <th className="text-left px-4 py-2.5">Data</th>
                    <th className="px-4 py-2.5 w-24" />
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e) => {
                    const cfg       = STATUS_CFG[e.status] ?? STATUS_CFG.pendente;
                    const isReceita = e.type === "receita";
                    return (
                      <tr key={e.id} className="border-t border-[#F0EBE3] hover:bg-[#FDFCFA] transition group">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${isReceita ? "bg-green-400" : "bg-red-400"}`} />
                            <div>
                              <p className="font-medium text-gray-800 leading-tight truncate max-w-44">{e.description}</p>
                              {e.clinicName && <p className="text-[10px] text-gray-400 mt-0.5">{e.clinicName}</p>}
                              {e.category   && <p className="text-[10px] text-gray-400">{e.category}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {e.planType ? (
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${PLAN_BADGE[e.planType] ?? PLAN_BADGE.solo}`}>
                              {PLAN_LABELS[e.planType] ?? e.planType}
                            </span>
                          ) : <span className="text-gray-300 text-xs">—</span>}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {e.paymentMethod ? (
                            <div className="flex items-center gap-1">
                              <CreditCard size={11} className="text-gray-400" />
                              {e.paymentMethod}
                            </div>
                          ) : "—"}
                        </td>
                        <td className={`px-4 py-3 text-right font-semibold ${isReceita ? "text-green-600" : "text-red-500"}`}>
                          {isReceita ? "+" : "-"}{fmtBRL(e.amount)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400">{fmtDate(e.createdAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 justify-end opacity-0 group-hover:opacity-100 transition">
                            {e.status === "pendente" && <>
                              <button onClick={() => setEntryStatus(e.id, "aprovado")}
                                className="w-7 h-7 bg-green-50 hover:bg-green-100 border border-green-200 text-green-600 rounded-lg flex items-center justify-center transition">
                                <Check size={11} />
                              </button>
                              <button onClick={() => setEntryStatus(e.id, "rejeitado")}
                                className="w-7 h-7 bg-red-50 hover:bg-red-100 border border-red-200 text-red-500 rounded-lg flex items-center justify-center transition">
                                <X size={11} />
                              </button>
                            </>}
                            {e.status !== "pendente" && (
                              <button onClick={() => setEntryStatus(e.id, "pendente")}
                                className="w-7 h-7 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-400 rounded-lg flex items-center justify-center transition">
                                <Clock size={11} />
                              </button>
                            )}
                            <button onClick={() => removeEntry(e.id)}
                              className="w-7 h-7 bg-red-50 hover:bg-red-100 border border-red-100 text-red-400 rounded-lg flex items-center justify-center transition">
                              <Trash2 size={10} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* ── TAB: RECORRENTES ─────────────────────────────────────────────── */}
      {tab === "recorrentes" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {recorrentes.length} despesa{recorrentes.length !== 1 ? "s" : ""} recorrente{recorrentes.length !== 1 ? "s" : ""} cadastrada{recorrentes.length !== 1 ? "s" : ""}
            </p>
            <button
              onClick={() => { setShowForm(true); setForm((f) => ({ ...EMPTY_FORM, recorrente: true })); }}
              className="text-xs text-[#1F4D46] border border-[#1F4D46]/30 hover:bg-[#F0F7F5] px-3 py-1.5 rounded-lg transition flex items-center gap-1.5"
            >
              <Plus size={12} /> Nova recorrente
            </button>
          </div>

          {/* New entry form (shared with extrato) */}
          {showForm && (
            <div className="bg-white border border-[#E8E0D2] rounded-2xl p-5">
              <h3 className="text-sm font-bold text-[#1F4D46] mb-4">Nova despesa recorrente</h3>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Categoria</label>
                  <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    className="w-full border border-[#D8CDB9] rounded-xl px-3 py-2 text-sm bg-white focus:outline-none">
                    <option value="">Selecionar…</option>
                    {DESPESA_CATS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Frequência</label>
                  <select value={form.recorrencia} onChange={(e) => setForm((f) => ({ ...f, recorrencia: e.target.value }))}
                    className="w-full border border-[#D8CDB9] rounded-xl px-3 py-2 text-sm bg-white focus:outline-none">
                    {Object.entries(RECORRENCIA_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-gray-400 mb-1 block">Descrição *</label>
                  <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Ex: Servidor AWS, Stripe, Notion…"
                    className="w-full border border-[#D8CDB9] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Valor (R$) *</label>
                  <input type="number" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                    className="w-full border border-[#D8CDB9] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Encerrar em (opcional)</label>
                  <input type="date" value={form.recorrenciaFim}
                    onChange={(e) => setForm((f) => ({ ...f, recorrenciaFim: e.target.value }))}
                    className="w-full border border-[#D8CDB9] rounded-xl px-3 py-2 text-sm bg-white focus:outline-none" />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded-xl">Cancelar</button>
                <button onClick={createEntry} disabled={saving}
                  className="bg-[#1F4D46] text-white px-5 py-2 rounded-xl text-sm font-medium flex items-center gap-2">
                  <RefreshCw size={13} /> {saving ? "Salvando…" : "Criar recorrente"}
                </button>
              </div>
            </div>
          )}

          {loadingR ? (
            <div className="py-10 text-center text-gray-400 text-sm">Carregando…</div>
          ) : recorrentes.length === 0 ? (
            <div className="bg-white border border-[#E8E0D2] rounded-2xl py-14 text-center text-gray-300 text-sm">
              Nenhuma despesa recorrente cadastrada.<br />
              <span className="text-xs text-gray-400 mt-1 block">Crie uma para gerar lançamentos pendentes automaticamente a cada período.</span>
            </div>
          ) : (
            <div className="bg-white border border-[#E8E0D2] rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[#F5F1EA] text-[10px] text-gray-400 uppercase tracking-wide">
                  <tr>
                    <th className="text-left px-5 py-2.5">Descrição</th>
                    <th className="text-left px-5 py-2.5">Categoria</th>
                    <th className="text-center px-5 py-2.5">Frequência</th>
                    <th className="text-right px-5 py-2.5">Valor</th>
                    <th className="text-left px-5 py-2.5">Encerra em</th>
                    <th className="px-5 py-2.5 w-12" />
                  </tr>
                </thead>
                <tbody>
                  {recorrentes.map((r) => (
                    <tr key={r.id} className="border-t border-[#F0EBE3] hover:bg-[#FDFCFA] transition group">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <RefreshCw size={12} className="text-[#1F4D46] shrink-0" />
                          <span className="font-medium text-gray-800">{r.description}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-500">{r.category || "—"}</td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600">
                          {RECORRENCIA_LABELS[r.recorrencia] ?? r.recorrencia}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold text-red-500">-{fmtBRL(r.amount)}</td>
                      <td className="px-5 py-3.5 text-xs text-gray-400">{r.recorrenciaFim ? fmtDate(r.recorrenciaFim) : "Indeterminado"}</td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => removeEntry(r.id)}
                          className="opacity-0 group-hover:opacity-100 transition w-7 h-7 bg-red-50 hover:bg-red-100 border border-red-100 text-red-400 rounded-lg flex items-center justify-center ml-auto"
                        >
                          <Trash2 size={11} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: MRR / SaaS ──────────────────────────────────────────────── */}
      {tab === "mrr" && (
        <div className="space-y-5">
          {loadingM ? (
            <div className="grid grid-cols-4 gap-4">
              {[1,2,3,4].map((i) => <div key={i} className="h-24 bg-white rounded-2xl animate-pulse border border-[#E8E0D2]" />)}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "MRR",  value: fmtBRL(mrr?.mrr),  icon: DollarSign, sub: "mensalistas" },
                  { label: "ARR",  value: mrr?.arr > 0 ? fmtBRL(mrr?.arr) : "R$ 0", icon: TrendingUp, sub: mrr?.arr > 0 ? "contratos anuais confirmados" : "nenhum anual ainda", color: mrr?.arr > 0 ? undefined : "text-gray-400" },
                  { label: "Novas este mês",  value: `+${mrr?.newThisMonth??0}`,icon: Users      },
                  { label: "Clínicas ativas", value: totalClinics,             icon: BarChart2  },
                ].map(({ label, value, icon: Icon, sub, color }) => (
                  <div key={label} className="bg-white border border-[#E8E0D2] rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">{label}</p>
                      <div className="w-6 h-6 bg-[#F0F7F5] rounded-lg flex items-center justify-center">
                        <Icon size={12} className="text-[#1F4D46]" />
                      </div>
                    </div>
                    <p className={`text-xl font-black ${color ?? "text-[#1F4D46]"}`}>{value}</p>
                    {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-white border border-[#E8E0D2] rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-bold text-[#1F4D46]">Distribuição por plano</p>
                    <div className="flex items-center gap-1.5 text-xs">
                      {((mrr?.newThisMonth??0) - (mrr?.newLastMonth??0)) >= 0
                        ? <ArrowUp size={11} className="text-green-500" />
                        : <ArrowDown size={11} className="text-red-400" />}
                      <span className={(mrr?.newThisMonth??0)>=(mrr?.newLastMonth??0) ? "text-green-600 font-semibold" : "text-red-500 font-semibold"}>
                        {Math.abs((mrr?.newThisMonth??0)-(mrr?.newLastMonth??0))} vs mês ant.
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {(mrr?.planBreakdown??[]).sort((a,b)=>b.count-a.count).map((p) => {
                      const pct = totalClinics > 0 ? Math.round((p.count/totalClinics)*100) : 0;
                      return (
                        <div key={p.plan}>
                          <div className="flex items-center justify-between mb-1 text-xs">
                            <span className="font-medium text-gray-700">{PLAN_LABELS[p.plan]??p.plan}</span>
                            <div className="flex gap-3">
                              <span className="text-gray-400">{p.count} clínica{p.count!==1?"s":""}</span>
                              <span className="font-semibold text-[#1F4D46]">{fmtBRL(p.mrr)}/mês</span>
                            </div>
                          </div>
                          <div className="h-1.5 bg-[#F0EBE3] rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${PLAN_COLORS_BAR[p.plan]??"bg-gray-300"}`} style={{ width:`${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white border border-[#E8E0D2] rounded-2xl p-5">
                  <p className="text-sm font-bold text-[#1F4D46] mb-4">Crescimento — últimos 6 meses</p>
                  {(mrr?.growth??[]).length > 0 && (
                    <div className="flex items-end gap-2 h-28">
                      {mrr.growth.map((g, i) => {
                        const max = Math.max(...mrr.growth.map(x => x.count), 1);
                        const h   = Math.max((g.count/max)*100, 4);
                        const last = i === mrr.growth.length - 1;
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <span className="text-xs font-semibold text-[#1F4D46]">{g.count}</span>
                            <div className={`w-full rounded-t-lg ${last ? "bg-[#1F4D46]" : "bg-[#D8CDB9]"}`} style={{ height:`${h}%` }} />
                            <span className="text-[10px] text-gray-400">{g.month}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
