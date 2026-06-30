import { useEffect, useState } from "react";
import { Users, TrendingUp, ChevronDown, ChevronUp, Settings2 } from "lucide-react";
import adminApi from "../services/api";
import { getFeatures } from "../config/features";
import AdminLayout from "../components/AdminLayout";
import SecaoInfo from "../components/SecaoInfo";
import toast from "react-hot-toast";

const PLAN_LABELS = { solo: "Solo", clinica: "Clínica", enterprise: "Enterprise", dev: "Dev" };
const PLAN_COLORS = {
  solo:       "bg-gray-100 text-gray-600",
  clinica:    "bg-emerald-100 text-emerald-700",
  enterprise: "bg-amber-100 text-amber-700",
  dev:        "bg-purple-100 text-purple-700",
};

const FEATURE_LABELS = {
  agenda:            "Agenda",
  patients:          "Pacientes",
  procedureMap:      "Mapa de Procedimentos",
  documents:         "Documentos",
  signatures:        "Assinatura Eletrônica",
  financial:         "Financeiro",
  faturamento:       "Faturamento (Asaas)",
  stock:             "Estoque & Produtos",
  analytics:         "Analytics",
  whatsapp:          "Automações WhatsApp",
  aiSummary:         "IA — Resumo de Paciente",
  aiAssistant:       "IA — Assistente",
  clube:             "Clube de Fidelidade",
  multiProfessional: "Multi-profissional",
};

function fmt(d) {
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function FeatureToggles({ clinic, onSave }) {
  const planBase    = getFeatures(clinic.plan);
  const overrides   = clinic.featureOverrides ?? {};
  const effective   = { ...planBase, ...overrides };
  const [local, setLocal] = useState(overrides);
  const [saving, setSaving] = useState(false);

  const isDirty = JSON.stringify(local) !== JSON.stringify(overrides);

  function toggle(key) {
    const current = local[key] ?? planBase[key];
    setLocal((prev) => ({ ...prev, [key]: !current }));
  }

  function resetKey(key) {
    setLocal((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  async function save() {
    setSaving(true);
    try {
      const res = await adminApi.patch(`/admin/clinics/${clinic.id}`, { featureOverrides: local });
      onSave(res.data);
      toast.success("Features atualizadas!");
    } catch {
      toast.error("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="px-6 pb-5 pt-2 bg-[#F2F0EB] border-t border-[#E6E2D8]">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Customização de features — sobrescreve o plano <span className="text-[#00704A]">{PLAN_LABELS[clinic.plan] ?? clinic.plan}</span>
        </p>
        <div className="flex items-center gap-2">
          {isDirty && (
            <button onClick={() => setLocal(overrides)}
              className="text-xs text-gray-400 hover:text-gray-600 transition">
              Descartar
            </button>
          )}
          <button onClick={save} disabled={!isDirty || saving}
            className="text-xs bg-[#00704A] hover:bg-[#1E3932] disabled:opacity-40 text-white px-4 py-1.5 rounded-lg transition">
            {saving ? "Salvando…" : "Salvar alterações"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {Object.entries(FEATURE_LABELS).map(([key, label]) => {
          const fromPlan     = planBase[key];
          const hasOverride  = key in local;
          const value        = hasOverride ? local[key] : fromPlan;

          return (
            <div key={key}
              className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border transition
                ${value ? "bg-[#F0F7F5] border-[#00704A]/20" : "bg-white border-[#E6E2D8]"}`}>
              <div className="min-w-0">
                <p className={`text-xs font-medium truncate ${value ? "text-[#00704A]" : "text-gray-400"}`}>{label}</p>
                {hasOverride && (
                  <p className="text-[10px] text-amber-500">
                    Override {fromPlan ? "(ligado→desl.)" : "(desl.→ligado)"}
                    <button onClick={() => resetKey(key)} className="ml-1 underline hover:no-underline">reset</button>
                  </p>
                )}
              </div>
              <button onClick={() => toggle(key)}
                className={`shrink-0 w-9 h-5 rounded-full transition-colors relative ${value ? "bg-[#00704A]" : "bg-gray-200"}`}>
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${value ? "left-4" : "left-0.5"}`} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AdminPanel() {
  const [clinics,   setClinics]   = useState([]);
  const [stats,     setStats]     = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [editPlan,  setEditPlan]  = useState(null);
  const [expanded,  setExpanded]  = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  function loadData() {
    Promise.all([adminApi.get("/admin/clinics"), adminApi.get("/admin/stats")])
      .then(([c, s]) => { setClinics(c.data); setStats(s.data); })
      .catch(() => toast.error("Erro ao carregar dados — verifique se está logado como admin"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadData(); }, []);

  async function changePlan(clinicId, plan) {
    try {
      const res = await adminApi.patch(`/admin/clinics/${clinicId}`, { plan });
      setClinics((prev) => prev.map((c) => c.id === clinicId ? { ...c, ...res.data } : c));
      toast.success("Plano atualizado!");
    } catch { toast.error("Erro ao atualizar plano"); }
    finally   { setEditPlan(null); }
  }

  function handleFeatureSave(updated) {
    setClinics((prev) => prev.map((c) => c.id === updated.id ? { ...c, ...updated } : c));
  }

  const byPlan = (plan) => stats?.byPlan?.find((b) => b.plan === plan)?._count?._all ?? 0;

  return (
    <AdminLayout>
        <SecaoInfo titulo="O que é este painel?" itens={[
          { nome: "Visão geral", desc: "Resumo de quantas clínicas usam o sistema e a distribuição entre os planos (Solo, Clínica, Pro, Dev/Enterprise)." },
          { nome: "Clínicas cadastradas", desc: "Lista todas as clínicas com plano, nº de pacientes e agendamentos, e data de cadastro." },
          { nome: "Trocar plano", desc: "Clique no badge de plano de uma clínica para alterar o plano dela na hora." },
          { nome: "Features por clínica", desc: "Expanda uma clínica para ligar/desligar funcionalidades específicas, sobrescrevendo o padrão do plano." },
        ]} />

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total de clínicas", value: stats?.total ?? "—",  icon: Users,      color: "#00704A" },
            { label: "Plano Solo",        value: byPlan("solo"),        icon: TrendingUp, color: "#6B7280" },
            { label: "Plano Clínica",     value: byPlan("clinica"),     icon: TrendingUp, color: "#00704A" },
            { label: "Dev / Enterprise",  value: byPlan("dev") + byPlan("enterprise"), icon: TrendingUp, color: "#7C3AED" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-2xl p-5 border border-[#E6E2D8]">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">{label}</p>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}18` }}>
                  <Icon size={14} style={{ color }} />
                </div>
              </div>
              <p className="text-3xl font-black text-[#00704A]">{value}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-[#E6E2D8] overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-[#E6E2D8] flex items-center justify-between">
            <h2 className="text-base font-bold text-[#00704A]">Clínicas cadastradas</h2>
            <button
              onClick={() => setShowCreate(true)}
              className="bg-[#00704A] hover:bg-[#1E3932] text-white text-sm font-semibold px-4 py-2 rounded-xl transition"
            >
              + Nova clínica
            </button>
          </div>

          {loading ? (
            <div className="py-16 text-center text-gray-400 text-sm">Carregando…</div>
          ) : clinics.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-sm">Nenhuma clínica cadastrada ainda.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-[#F2F0EB] text-xs text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="text-left px-6 py-3">Clínica</th>
                  <th className="text-left px-6 py-3">E-mail</th>
                  <th className="text-left px-6 py-3">Plano</th>
                  <th className="text-center px-6 py-3">Pacientes</th>
                  <th className="text-center px-6 py-3">Agend.</th>
                  <th className="text-left px-6 py-3">Cadastro</th>
                  <th className="text-center px-6 py-3">Features</th>
                </tr>
              </thead>
              <tbody>
                {clinics.map((c) => (
                  <>
                    <tr key={c.id} className={`border-t border-[#E6E2D8] hover:bg-[#F2F0EB] transition ${expanded === c.id ? "bg-[#F2F0EB]" : ""}`}>
                      <td className="px-6 py-4 font-medium text-gray-800">{c.name}</td>
                      <td className="px-6 py-4 text-gray-500">{c.email}</td>
                      <td className="px-6 py-4">
                        {editPlan === c.id ? (
                          <select autoFocus defaultValue={c.plan}
                            onBlur={() => setEditPlan(null)}
                            onChange={(e) => changePlan(c.id, e.target.value)}
                            className="border border-[#CBA258] rounded-lg px-2 py-1 text-xs bg-white">
                            <option value="dev">Dev</option>
                            <option value="solo">Solo</option>
                            <option value="clinica">Clínica</option>
                            <option value="enterprise">Enterprise</option>
                          </select>
                        ) : (
                          <button onClick={() => setEditPlan(c.id)}
                            className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full transition hover:opacity-80 ${PLAN_COLORS[c.plan] ?? PLAN_COLORS.solo}`}>
                            {PLAN_LABELS[c.plan] ?? c.plan}
                            <ChevronDown size={11} />
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-600">{c._count.patients}</td>
                      <td className="px-6 py-4 text-center text-gray-600">{c._count.appointments}</td>
                      <td className="px-6 py-4 text-gray-400">{fmt(c.createdAt)}</td>
                      <td className="px-6 py-4 text-center">
                        <button onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                          className={`w-8 h-8 rounded-xl flex items-center justify-center mx-auto transition
                            ${expanded === c.id ? "bg-[#00704A] text-white" : "border border-[#DDD8CC] text-gray-400 hover:border-[#00704A] hover:text-[#00704A]"}`}>
                          {expanded === c.id ? <ChevronUp size={14} /> : <Settings2 size={14} />}
                        </button>
                      </td>
                    </tr>

                    {expanded === c.id && (
                      <tr key={`${c.id}-features`}>
                        <td colSpan={7} className="p-0">
                          <FeatureToggles clinic={c} onSave={handleFeatureSave} />
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {showCreate && (
          <CreateClinicModal
            onClose={() => setShowCreate(false)}
            onCreated={() => { setShowCreate(false); loadData(); }}
          />
        )}
    </AdminLayout>
  );
}

function CreateClinicModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: "", email: "", clinicName: "", password: "", plan: "solo" });
  const [saving, setSaving] = useState(false);

  const PLAN_OPTIONS = [
    { value: "demo",       label: "Demo / Trial" },
    { value: "solo",       label: "Solo" },
    { value: "clinica",    label: "Clínica" },
    { value: "enterprise", label: "Enterprise" },
    { value: "dev",        label: "Dev (tudo liberado)" },
  ];

  function set(key, value) { setForm((f) => ({ ...f, [key]: value })); }

  function genPassword() {
    const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let p = "";
    for (let i = 0; i < 10; i++) p += chars[Math.floor(Math.random() * chars.length)];
    set("password", p);
  }

  async function submit(e) {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast.error("Preencha nome, e-mail e senha.");
      return;
    }
    setSaving(true);
    try {
      await adminApi.post("/admin/clinics", form);
      toast.success("Clínica criada! A pessoa deverá redefinir a senha no 1º acesso.");
      onCreated();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Erro ao criar clínica");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-[#00704A] mb-1">Nova clínica</h3>
        <p className="text-xs text-gray-400 mb-5">A pessoa receberá esta senha e deverá trocá-la no primeiro acesso.</p>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-500">Nome do responsável *</label>
            <input value={form.name} onChange={(e) => set("name", e.target.value)}
              className="w-full border border-[#DDD8CC] rounded-xl px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-[#00704A]/20" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Nome da clínica</label>
            <input value={form.clinicName} onChange={(e) => set("clinicName", e.target.value)}
              className="w-full border border-[#DDD8CC] rounded-xl px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-[#00704A]/20" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">E-mail (login) *</label>
            <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)}
              className="w-full border border-[#DDD8CC] rounded-xl px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-[#00704A]/20" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Senha inicial *</label>
            <div className="flex gap-2 mt-1">
              <input value={form.password} onChange={(e) => set("password", e.target.value)}
                className="flex-1 border border-[#DDD8CC] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00704A]/20" />
              <button type="button" onClick={genPassword}
                className="text-xs text-[#00704A] border border-[#DDD8CC] rounded-xl px-3 hover:bg-[#F2F0EB] transition">Gerar</button>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Plano</label>
            <select value={form.plan} onChange={(e) => set("plan", e.target.value)}
              className="w-full border border-[#DDD8CC] rounded-xl px-3 py-2 text-sm mt-1 bg-white focus:outline-none focus:ring-2 focus:ring-[#00704A]/20">
              {PLAN_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="text-sm text-gray-500 px-4 py-2 rounded-xl hover:bg-gray-100 transition">Cancelar</button>
            <button type="submit" disabled={saving}
              className="bg-[#00704A] hover:bg-[#1E3932] text-white text-sm font-semibold px-4 py-2 rounded-xl transition disabled:opacity-50">
              {saving ? "Criando…" : "Criar clínica"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
