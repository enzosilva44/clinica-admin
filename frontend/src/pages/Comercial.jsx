import { useEffect, useState } from "react";
import { Plus, Trash2, DollarSign, Phone, Mail, Calendar } from "lucide-react";
import AdminLayout from "../components/AdminLayout";
import adminApi from "../services/api";
import toast from "react-hot-toast";

const PIPELINE = ["prospecto", "contato", "demo", "proposta", "fechado", "perdido"];

const STAGE_CFG = {
  prospecto: { label: "Prospecto",  color: "bg-gray-100 text-gray-600",      bar: "bg-gray-300"   },
  contato:   { label: "Contato",    color: "bg-blue-50 text-blue-600",        bar: "bg-blue-400"   },
  demo:      { label: "Demo",       color: "bg-purple-50 text-purple-600",    bar: "bg-purple-400" },
  proposta:  { label: "Proposta",   color: "bg-amber-50 text-amber-600",      bar: "bg-amber-400"  },
  fechado:   { label: "Fechado ✓",  color: "bg-emerald-50 text-emerald-700",  bar: "bg-emerald-400"},
  perdido:   { label: "Perdido",    color: "bg-red-50 text-red-500",          bar: "bg-red-300"    },
};

const SOURCES = ["Instagram", "Indicação", "Google", "Site", "LinkedIn", "Evento", "Outro"];

const EMPTY_FORM = { name: "", email: "", phone: "", clinicName: "", source: "", status: "prospecto", value: "", notes: "", nextFollowUp: "" };

function fmt(n) {
  if (!n) return null;
  return `R$ ${Number(n).toLocaleString("pt-BR")}`;
}

function fmtDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export default function Comercial() {
  const [leads,   setLeads]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]       = useState(EMPTY_FORM);
  const [saving, setSaving]   = useState(false);
  const [editId, setEditId]   = useState(null);

  async function load() {
    setLoading(true);
    try {
      const res = await adminApi.get("/admin/leads");
      setLeads(res.data);
    } catch { toast.error("Erro ao carregar leads"); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function save() {
    if (!form.name.trim()) return toast.error("Nome obrigatório.");
    setSaving(true);
    try {
      if (editId) {
        const res = await adminApi.patch(`/admin/leads/${editId}`, form);
        setLeads((l) => l.map((x) => x.id === editId ? res.data : x));
        toast.success("Lead atualizado!");
      } else {
        const res = await adminApi.post("/admin/leads", form);
        setLeads((l) => [res.data, ...l]);
        toast.success("Lead criado!");
      }
      setForm(EMPTY_FORM);
      setShowForm(false);
      setEditId(null);
    } catch { toast.error("Erro ao salvar lead."); }
    finally { setSaving(false); }
  }

  async function moveStage(lead, direction) {
    const idx  = PIPELINE.indexOf(lead.status);
    const next = PIPELINE[idx + direction];
    if (!next) return;
    try {
      const res = await adminApi.patch(`/admin/leads/${lead.id}`, { status: next });
      setLeads((l) => l.map((x) => x.id === lead.id ? res.data : x));
    } catch { toast.error("Erro ao mover."); }
  }

  async function remove(id) {
    if (!confirm("Remover este lead?")) return;
    try {
      await adminApi.delete(`/admin/leads/${id}`);
      setLeads((l) => l.filter((x) => x.id !== id));
    } catch { toast.error("Erro ao remover."); }
  }

  function openEdit(lead) {
    setForm({
      name: lead.name, email: lead.email ?? "", phone: lead.phone ?? "",
      clinicName: lead.clinicName ?? "", source: lead.source ?? "",
      status: lead.status, value: lead.value ?? "", notes: lead.notes ?? "",
      nextFollowUp: lead.nextFollowUp ? lead.nextFollowUp.slice(0, 10) : "",
    });
    setEditId(lead.id);
    setShowForm(true);
  }

  const grouped = PIPELINE.reduce((acc, s) => {
    acc[s] = leads.filter((l) => l.status === s);
    return acc;
  }, {});

  const totalValue    = leads.filter((l) => l.status === "fechado").reduce((s, l) => s + (l.value ?? 0), 0);
  const pipelineValue = leads.filter((l) => !["fechado","perdido"].includes(l.status)).reduce((s, l) => s + (l.value ?? 0), 0);

  // Conversão: fechados ÷ (fechados + perdidos)
  const fechados   = grouped.fechado.length;
  const perdidos   = grouped.perdido.length;
  const resolvidos = fechados + perdidos;
  const convPct    = resolvidos > 0 ? Math.round((fechados / resolvidos) * 100) : 0;
  const META       = 30; // % — meta de conversão
  const metaPct    = Math.min(Math.round((convPct / META) * 100), 100);
  const convCfg    = convPct >= META
    ? { color: "text-emerald-600", bar: "bg-emerald-500", bg: "bg-emerald-50 border-emerald-200",  label: "Meta atingida!" }
    : convPct >= META * 0.7
    ? { color: "text-amber-600",   bar: "bg-amber-400",   bg: "bg-amber-50 border-amber-200",    label: "Quase lá"       }
    : { color: "text-[#1F4D46]",   bar: "bg-[#1F4D46]",   bg: "bg-[#F5F1EA] border-[#D8CDB9]",  label: `Meta: ${META}%` };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-[#1F4D46]">Comercial</h1>
          <p className="text-gray-400 text-sm mt-0.5">{leads.length} lead{leads.length !== 1 ? "s" : ""} no pipeline</p>
        </div>
        <button
          onClick={() => { setForm(EMPTY_FORM); setEditId(null); setShowForm((v) => !v); }}
          className="bg-[#1F4D46] hover:bg-[#285A50] text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition"
        >
          <Plus size={15} /> Novo lead
        </button>
      </div>

      {/* Barra de conversão */}
      <div className={`border rounded-2xl px-5 py-4 mb-5 ${convCfg.bg}`}>
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Taxa de conversão</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className={`text-3xl font-black ${convCfg.color}`}>{convPct}%</span>
              <span className="text-xs text-gray-400">
                {fechados} fechado{fechados !== 1 ? "s" : ""} de {resolvidos} resolvido{resolvidos !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${convCfg.color} bg-white/70`}>
              {convCfg.label}
            </span>
            <p className="text-[10px] text-gray-400 mt-1.5">
              Meta: <span className="font-semibold">{META}%</span> · {resolvidos === 0 ? "Sem dados ainda" : `faltam ${Math.max(0, Math.ceil((META / 100) * resolvidos) - fechados)} fechamento${Math.max(0, Math.ceil((META / 100) * resolvidos) - fechados) !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>

        {/* Barra de progresso em relação à meta */}
        <div className="relative h-3 bg-white/60 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${convCfg.bar}`}
            style={{ width: `${metaPct}%` }}
          />
          {/* Marker da meta */}
          <div className="absolute top-0 bottom-0 w-0.5 bg-gray-400/40" style={{ left: "100%" }} />
        </div>

        {/* Mini funil embaixo */}
        {resolvidos > 0 && (
          <div className="flex items-center gap-4 mt-3 text-[10px] text-gray-500">
            {PIPELINE.filter((s) => grouped[s].length > 0).map((s) => (
              <span key={s} className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${STAGE_CFG[s].bar}`} />
                {STAGE_CFG[s].label.replace(" ✓", "")}: <span className="font-semibold">{grouped[s].length}</span>
              </span>
            ))}
          </div>
        )}

        {resolvidos === 0 && (
          <p className="text-xs text-gray-400 mt-2">
            A taxa aparece assim que algum lead for marcado como <span className="font-medium">Fechado</span> ou <span className="font-medium">Perdido</span>.
          </p>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { label: "Total de leads",      value: leads.length           },
          { label: "Pipeline (MRR est.)", value: fmt(pipelineValue) ?? "R$ 0" },
          { label: "Fechados (MRR)",      value: fmt(totalValue)   ?? "R$ 0" },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white border border-[#E8E0D2] rounded-2xl p-4">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">{label}</p>
            <p className="text-2xl font-black text-[#1F4D46]">{value}</p>
          </div>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white border border-[#E8E0D2] rounded-2xl p-5 mb-6">
          <h3 className="text-sm font-bold text-[#1F4D46] mb-4">{editId ? "Editar lead" : "Novo lead"}</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
            {[
              { key: "name",      label: "Nome *",       type: "text"  },
              { key: "clinicName",label: "Clínica",      type: "text"  },
              { key: "phone",     label: "Telefone",     type: "text"  },
              { key: "email",     label: "E-mail",       type: "email" },
              { key: "value",     label: "MRR estimado", type: "number"},
              { key: "nextFollowUp",label:"Follow-up",   type: "date"  },
            ].map(({ key, label, type }) => (
              <div key={key}>
                <label className="text-xs text-gray-400 mb-1 block">{label}</label>
                <input
                  type={type}
                  value={form[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  className="w-full border border-[#D8CDB9] rounded-xl px-3 py-2 text-sm focus:outline-none"
                />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Origem</label>
              <select value={form.source} onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
                className="w-full border border-[#D8CDB9] rounded-xl px-3 py-2 text-sm bg-white focus:outline-none">
                <option value="">Selecionar…</option>
                {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Estágio</label>
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className="w-full border border-[#D8CDB9] rounded-xl px-3 py-2 text-sm bg-white focus:outline-none">
                {PIPELINE.map((s) => <option key={s} value={s}>{STAGE_CFG[s].label}</option>)}
              </select>
            </div>
          </div>
          <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder="Notas…" rows={2}
            className="w-full border border-[#D8CDB9] rounded-xl px-3 py-2 text-sm focus:outline-none resize-none mb-3" />
          <div className="flex gap-2 justify-end">
            <button onClick={() => { setShowForm(false); setEditId(null); setForm(EMPTY_FORM); }}
              className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded-xl transition">Cancelar</button>
            <button onClick={save} disabled={saving}
              className="bg-[#1F4D46] hover:bg-[#285A50] disabled:opacity-50 text-white px-5 py-2 rounded-xl text-sm font-medium transition">
              {saving ? "Salvando…" : editId ? "Salvar" : "Criar lead"}
            </button>
          </div>
        </div>
      )}

      {/* Kanban */}
      {loading ? (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {PIPELINE.map((s) => <div key={s} className="h-40 bg-white rounded-2xl animate-pulse border border-[#E8E0D2]" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {PIPELINE.map((stage) => {
            const cfg = STAGE_CFG[stage];
            return (
              <div key={stage} className="bg-white border border-[#E8E0D2] rounded-2xl overflow-hidden">
                <div className={`px-3 py-2.5 border-b border-[#F0EBE3] flex items-center gap-1.5`}>
                  <div className={`w-2 h-2 rounded-full ${cfg.bar}`} />
                  <span className="text-xs font-semibold text-gray-700">{cfg.label}</span>
                  <span className="ml-auto text-xs text-gray-400">{grouped[stage].length}</span>
                </div>
                <div className="p-2 space-y-2 min-h-24">
                  {grouped[stage].map((lead) => (
                    <div key={lead.id} className="bg-[#F5F1EA] border border-[#E8E0D2] rounded-xl p-2.5 group">
                      <div className="flex items-start justify-between gap-1 mb-1.5">
                        <button onClick={() => openEdit(lead)} className="text-xs font-semibold text-[#1F4D46] text-left hover:underline leading-tight">
                          {lead.name}
                        </button>
                        <button onClick={() => remove(lead.id)} className="opacity-0 group-hover:opacity-100 transition text-gray-300 hover:text-red-400 shrink-0">
                          <Trash2 size={11} />
                        </button>
                      </div>
                      {lead.clinicName && <p className="text-[10px] text-gray-500 mb-1.5 truncate">{lead.clinicName}</p>}
                      <div className="flex flex-col gap-1">
                        {lead.value && (
                          <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                            <DollarSign size={9} /> {fmt(lead.value)}/mês
                          </span>
                        )}
                        {lead.source && <span className="text-[10px] text-gray-400">{lead.source}</span>}
                        {lead.nextFollowUp && (
                          <span className="text-[10px] text-amber-500 flex items-center gap-0.5">
                            <Calendar size={9} /> {fmtDate(lead.nextFollowUp)}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1 mt-2">
                        <button onClick={() => moveStage(lead, -1)} disabled={PIPELINE.indexOf(lead.status) === 0}
                          className="flex-1 text-[10px] text-gray-400 hover:text-[#1F4D46] disabled:opacity-20 transition">← </button>
                        <button onClick={() => moveStage(lead, +1)} disabled={PIPELINE.indexOf(lead.status) === PIPELINE.length - 1}
                          className="flex-1 text-[10px] text-gray-400 hover:text-[#1F4D46] disabled:opacity-20 transition text-right"> →</button>
                      </div>
                    </div>
                  ))}
                  {grouped[stage].length === 0 && (
                    <p className="text-[10px] text-gray-300 text-center py-3">Vazio</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}
