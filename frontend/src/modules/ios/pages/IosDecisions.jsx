import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { CalendarClock, Plus, Scale, Search } from "lucide-react";
import IosLayout from "../components/IosLayout";
import {
  IosBadge,
  IosButton,
  IosEmpty,
  IosError,
  IosField,
  IosLoading,
  IosModal,
  inputClass,
} from "../components/IosUi";
import { iosApi, iosError } from "../iosApi";
import { fmtDate } from "../iosFormat";

const EMPTY = {
  title: "",
  context: "",
  decision: "",
  rationale: "",
  alternatives: "",
  evidence: "",
  cycleId: "",
  objectiveId: "",
  reviewAt: "",
  status: "DECIDED",
};

export default function IosDecisions() {
  const [decisions, setDecisions] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [decisionResponse, cycleResponse] = await Promise.all([
        iosApi.decisions(),
        iosApi.cycles(),
      ]);
      setDecisions(decisionResponse.data);
      setCycles(cycleResponse.data);
    } catch (requestError) {
      setError(iosError(requestError, "Não foi possível carregar as decisões."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const selectedCycle = cycles.find((cycle) => cycle.id === form.cycleId);
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return decisions;
    return decisions.filter((item) =>
      [item.title, item.context, item.decision, item.rationale]
        .some((value) => value?.toLowerCase().includes(term))
    );
  }, [decisions, search]);

  async function createDecision(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await iosApi.createDecision({
        title: form.title,
        context: form.context,
        decision: form.decision,
        rationale: form.rationale || null,
        alternatives: form.alternatives.split("\n").map((value) => value.trim()).filter(Boolean),
        evidence: form.evidence.split("\n").map((value) => value.trim()).filter(Boolean),
        cycleId: form.cycleId || null,
        objectiveId: form.objectiveId || null,
        reviewAt: form.reviewAt || null,
        status: form.status,
      });
      toast.success("Decisão registrada na memória da empresa.");
      setForm(EMPTY);
      setShowCreate(false);
      await load();
    } catch (requestError) {
      toast.error(iosError(requestError, "Não foi possível registrar a decisão."));
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(id, status) {
    try {
      await iosApi.updateDecision(id, { status });
      toast.success("Estado da decisão atualizado.");
      await load();
    } catch (requestError) {
      toast.error(iosError(requestError, "Não foi possível atualizar a decisão."));
    }
  }

  if (loading) {
    return <IosLayout title="Registro de Decisões" subtitle="Contexto, alternativas, evidências e resultado."><IosLoading /></IosLayout>;
  }

  if (error) {
    return <IosLayout title="Registro de Decisões" subtitle="Contexto, alternativas, evidências e resultado."><IosError message={error} onRetry={load} /></IosLayout>;
  }

  return (
    <IosLayout
      title="Registro de Decisões"
      subtitle="Preserve não apenas o que foi escolhido, mas por que foi escolhido."
      actions={<IosButton onClick={() => setShowCreate(true)}><Plus size={15} /> Nova decisão</IosButton>}
    >
      <div className="relative mb-5">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
        <input className={`${inputClass} pl-9`} placeholder="Buscar decisões…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <IosEmpty
          title={decisions.length ? "Nenhuma decisão encontrada" : "A memória de decisões está vazia"}
          description="Registre decisões estratégicas, financeiras, comerciais e de produto com evidências."
          action={!decisions.length && <IosButton onClick={() => setShowCreate(true)}><Plus size={14} /> Registrar primeira decisão</IosButton>}
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => (
            <article key={item.id} className="rounded-3xl border border-[#E3DED3] bg-white p-5">
              <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                <div className="flex min-w-0 gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#E6F3EE] text-[#00704A]"><Scale size={18} /></span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-black text-gray-800">{item.title}</h2>
                      <IosBadge status={item.status} />
                    </div>
                    <p className="mt-1 text-xs text-gray-400">{fmtDate(item.createdAt)}{item.reviewAt ? ` · revisar em ${fmtDate(item.reviewAt)}` : ""}</p>
                  </div>
                </div>
                <select
                  value={item.status}
                  onChange={(event) => updateStatus(item.id, event.target.value)}
                  className="rounded-xl border border-[#DDD8CC] bg-white px-3 py-2 text-xs font-semibold text-gray-600 outline-none focus:border-[#00704A]"
                >
                  <option value="DRAFT">Rascunho</option>
                  <option value="DECIDED">Decidida</option>
                  <option value="REVIEWED">Revisada</option>
                  <option value="REVERSED">Revertida</option>
                </select>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-[#F7F5F0] p-4">
                  <p className="text-[10px] font-black uppercase tracking-wide text-gray-400">Contexto</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-gray-600">{item.context}</p>
                </div>
                <div className="rounded-2xl border border-[#CFE2DA] bg-[#F0F8F5] p-4">
                  <p className="text-[10px] font-black uppercase tracking-wide text-[#00704A]/60">Decisão</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-relaxed text-[#174B3A]">{item.decision}</p>
                </div>
              </div>

              {(item.rationale || item.alternatives?.length || item.evidence?.length) && (
                <div className="mt-4 grid gap-4 border-t border-[#EEEAE1] pt-4 lg:grid-cols-3">
                  {item.rationale && <div><p className="text-[10px] font-black uppercase tracking-wide text-gray-400">Racional</p><p className="mt-1 text-xs leading-relaxed text-gray-600">{item.rationale}</p></div>}
                  {item.alternatives?.length > 0 && <div><p className="text-[10px] font-black uppercase tracking-wide text-gray-400">Alternativas</p><ul className="mt-1 list-inside list-disc text-xs text-gray-600">{item.alternatives.map((value, index) => <li key={index}>{typeof value === "string" ? value : JSON.stringify(value)}</li>)}</ul></div>}
                  {item.evidence?.length > 0 && <div><p className="text-[10px] font-black uppercase tracking-wide text-gray-400">Evidências</p><ul className="mt-1 list-inside list-disc text-xs text-gray-600">{item.evidence.map((value, index) => <li key={index}>{typeof value === "string" ? value : JSON.stringify(value)}</li>)}</ul></div>}
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      <IosModal open={showCreate} title="Registrar decisão" subtitle="Uma decisão útil preserva contexto, alternativas e evidências." onClose={() => setShowCreate(false)} width="max-w-3xl">
        <form onSubmit={createDecision} className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2"><IosField label="Título"><input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></IosField></div>
          <div className="md:col-span-2"><IosField label="Contexto" hint="Qual problema, restrição ou oportunidade originou a decisão?"><textarea className={`${inputClass} min-h-28 resize-y`} value={form.context} onChange={(e) => setForm({ ...form, context: e.target.value })} required /></IosField></div>
          <div className="md:col-span-2"><IosField label="Decisão tomada"><textarea className={`${inputClass} min-h-28 resize-y`} value={form.decision} onChange={(e) => setForm({ ...form, decision: e.target.value })} required /></IosField></div>
          <div className="md:col-span-2"><IosField label="Racional"><textarea className={`${inputClass} min-h-20 resize-y`} value={form.rationale} onChange={(e) => setForm({ ...form, rationale: e.target.value })} /></IosField></div>
          <IosField label="Alternativas consideradas" hint="Uma por linha."><textarea className={`${inputClass} min-h-24 resize-y`} value={form.alternatives} onChange={(e) => setForm({ ...form, alternatives: e.target.value })} /></IosField>
          <IosField label="Evidências consultadas" hint="Métrica, relatório, documento ou referência por linha."><textarea className={`${inputClass} min-h-24 resize-y`} value={form.evidence} onChange={(e) => setForm({ ...form, evidence: e.target.value })} /></IosField>
          <IosField label="Ciclo estratégico">
            <select className={inputClass} value={form.cycleId} onChange={(e) => setForm({ ...form, cycleId: e.target.value, objectiveId: "" })}>
              <option value="">Sem ciclo</option>{cycles.map((cycle) => <option key={cycle.id} value={cycle.id}>{cycle.name}</option>)}
            </select>
          </IosField>
          <IosField label="Objetivo relacionado">
            <select className={inputClass} value={form.objectiveId} onChange={(e) => setForm({ ...form, objectiveId: e.target.value })} disabled={!selectedCycle}>
              <option value="">Sem objetivo</option>{selectedCycle?.objectives.map((objective) => <option key={objective.id} value={objective.id}>{objective.title}</option>)}
            </select>
          </IosField>
          <IosField label="Revisar em">
            <div className="relative">
              <CalendarClock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
              <input type="date" className={`${inputClass} pl-9`} value={form.reviewAt} onChange={(e) => setForm({ ...form, reviewAt: e.target.value })} />
            </div>
          </IosField>
          <IosField label="Estado">
            <select className={inputClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="DRAFT">Rascunho</option><option value="DECIDED">Decidida</option>
            </select>
          </IosField>
          <div className="flex justify-end gap-2 md:col-span-2">
            <IosButton variant="ghost" onClick={() => setShowCreate(false)}>Cancelar</IosButton>
            <IosButton type="submit" disabled={saving}>{saving ? "Registrando…" : "Registrar decisão"}</IosButton>
          </div>
        </form>
      </IosModal>
    </IosLayout>
  );
}
