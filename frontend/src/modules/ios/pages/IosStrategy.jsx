import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  CalendarRange,
  Check,
  ChevronDown,
  Circle,
  Flag,
  Link2,
  Plus,
  Rocket,
  Target,
  Unlink,
} from "lucide-react";
import api from "../../../services/api";
import IosLayout from "../components/IosLayout";
import {
  IosBadge,
  IosButton,
  IosEmpty,
  IosError,
  IosField,
  IosLoading,
  IosModal,
  IosProgress,
  inputClass,
} from "../components/IosUi";
import { iosApi, iosError } from "../iosApi";
import { currentQuarter, fmtDate, fmtMetric, inputDate, STATUS_LABEL } from "../iosFormat";

const OBJECTIVE_STATUS = ["DRAFT", "ACTIVE", "AT_RISK", "COMPLETED", "CANCELED"];
const INITIATIVE_STATUS = ["PLANNED", "IN_PROGRESS", "BLOCKED", "COMPLETED", "CANCELED"];

function StatusSelect({ value, values, onChange }) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="rounded-lg border border-[#DDD8CC] bg-white px-2 py-1.5 text-xs font-semibold text-gray-600 outline-none focus:border-[#00704A]"
    >
      {values.map((status) => <option key={status} value={status}>{STATUS_LABEL[status] ?? status}</option>)}
    </select>
  );
}

export default function IosStrategy() {
  const [cycles, setCycles] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedCycleId, setSelectedCycleId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  async function load(preferredCycleId) {
    setLoading(true);
    setError("");
    try {
      const [cyclesResponse, metricsResponse, tasksResponse] = await Promise.all([
        iosApi.cycles(),
        iosApi.metrics(),
        api.get("/admin/tasks"),
      ]);
      setCycles(cyclesResponse.data);
      setMetrics(metricsResponse.data.filter((metric) => metric.isActive));
      setTasks(tasksResponse.data);
      const nextId = preferredCycleId
        || selectedCycleId
        || cyclesResponse.data.find((cycle) => cycle.status === "ACTIVE")?.id
        || cyclesResponse.data[0]?.id
        || "";
      setSelectedCycleId(nextId);
    } catch (requestError) {
      setError(iosError(requestError, "Não foi possível carregar a estratégia."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const cycle = useMemo(
    () => cycles.find((item) => item.id === selectedCycleId) ?? null,
    [cycles, selectedCycleId]
  );

  function openCycle() {
    const quarter = currentQuarter();
    setForm({ ...quarter, description: "", cadence: "QUARTERLY", status: cycles.length ? "DRAFT" : "ACTIVE" });
    setModal({ type: "cycle" });
  }

  function openObjective() {
    setForm({ title: "", description: "", status: "ACTIVE", sortOrder: cycle?.objectives.length ?? 0 });
    setModal({ type: "objective" });
  }

  function openKeyResult(objective) {
    setForm({
      title: "",
      metricId: metrics[0]?.id ?? "",
      baseline: "0",
      target: "",
      startDate: inputDate(cycle.startDate),
      dueDate: inputDate(cycle.endDate),
      status: "ACTIVE",
    });
    setModal({ type: "keyResult", objective });
  }

  function openInitiative() {
    setForm({
      title: "",
      description: "",
      objectiveId: cycle.objectives[0]?.id ?? "",
      priority: "MEDIUM",
      status: "PLANNED",
      startDate: "",
      dueDate: "",
    });
    setModal({ type: "initiative" });
  }

  function openMilestone(initiative) {
    setForm({ title: "", dueDate: initiative.dueDate ? inputDate(initiative.dueDate) : "", status: "PENDING" });
    setModal({ type: "milestone", initiative });
  }

  function openTaskLink(initiative) {
    const linked = new Set(initiative.taskLinks.map((link) => link.taskId));
    const available = tasks.filter((task) => !linked.has(task.id));
    setForm({ taskId: available[0]?.id ?? "" });
    setModal({ type: "task", initiative, available });
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    try {
      let preferred = selectedCycleId;
      if (modal.type === "cycle") {
        const response = await iosApi.createCycle(form);
        preferred = response.data.id;
        toast.success("Ciclo estratégico criado.");
      } else if (modal.type === "objective") {
        await iosApi.createObjective(cycle.id, form);
        toast.success("Objetivo criado.");
      } else if (modal.type === "keyResult") {
        await iosApi.createKeyResult(modal.objective.id, form);
        toast.success("Resultado-chave criado.");
      } else if (modal.type === "initiative") {
        await iosApi.createInitiative(cycle.id, {
          ...form,
          objectiveId: form.objectiveId || null,
          startDate: form.startDate || null,
          dueDate: form.dueDate || null,
        });
        toast.success("Iniciativa criada.");
      } else if (modal.type === "milestone") {
        await iosApi.createMilestone(modal.initiative.id, {
          ...form,
          dueDate: form.dueDate || null,
        });
        toast.success("Marco criado.");
      } else if (modal.type === "task") {
        await iosApi.linkTask(modal.initiative.id, form.taskId);
        toast.success("Task vinculada à iniciativa.");
      }
      setModal(null);
      await load(preferred);
    } catch (requestError) {
      toast.error(iosError(requestError, "Não foi possível salvar."));
    } finally {
      setSaving(false);
    }
  }

  async function patchCycle(data) {
    try {
      await iosApi.updateCycle(cycle.id, data);
      toast.success(data.status === "ACTIVE" ? "Ciclo ativado." : "Ciclo atualizado.");
      await load(cycle.id);
    } catch (requestError) {
      toast.error(iosError(requestError, "Não foi possível atualizar o ciclo."));
    }
  }

  async function patchObjective(id, data) {
    try {
      await iosApi.updateObjective(id, data);
      await load(cycle.id);
    } catch (requestError) {
      toast.error(iosError(requestError, "Não foi possível atualizar o objetivo."));
    }
  }

  async function patchKeyResult(id, data) {
    try {
      await iosApi.updateKeyResult(id, data);
      await load(cycle.id);
    } catch (requestError) {
      toast.error(iosError(requestError, "Não foi possível atualizar o resultado-chave."));
    }
  }

  async function patchInitiative(id, data) {
    try {
      await iosApi.updateInitiative(id, data);
      await load(cycle.id);
    } catch (requestError) {
      toast.error(iosError(requestError, "Não foi possível atualizar a iniciativa."));
    }
  }

  async function toggleMilestone(milestone) {
    try {
      await iosApi.updateMilestone(milestone.id, {
        status: milestone.status === "COMPLETED" ? "PENDING" : "COMPLETED",
      });
      await load(cycle.id);
    } catch (requestError) {
      toast.error(iosError(requestError, "Não foi possível atualizar o marco."));
    }
  }

  async function unlinkTask(initiativeId, taskId) {
    try {
      await iosApi.unlinkTask(initiativeId, taskId);
      toast.success("Vínculo removido.");
      await load(cycle.id);
    } catch (requestError) {
      toast.error(iosError(requestError, "Não foi possível remover o vínculo."));
    }
  }

  if (loading) {
    return <IosLayout title="Estratégia" subtitle="Do propósito à execução mensurável."><IosLoading /></IosLayout>;
  }

  if (error) {
    return <IosLayout title="Estratégia" subtitle="Do propósito à execução mensurável."><IosError message={error} onRetry={load} /></IosLayout>;
  }

  return (
    <IosLayout
      title="Estratégia"
      subtitle="Ciclos, objetivos, resultados-chave, iniciativas e marcos no mesmo contexto."
      actions={<IosButton onClick={openCycle}><Plus size={15} /> Novo ciclo</IosButton>}
    >
      {cycles.length === 0 ? (
        <IosEmpty
          title="Nenhum ciclo estratégico"
          description="Crie o trimestre atual. Objetivos, iniciativas e decisões serão organizados dentro dele."
          action={<IosButton onClick={openCycle}><Plus size={14} /> Criar primeiro ciclo</IosButton>}
        />
      ) : (
        <>
          <div className="mb-5 flex flex-col justify-between gap-3 rounded-2xl border border-[#E3DED3] bg-white p-4 md:flex-row md:items-center">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#E6F3EE] text-[#00704A]"><CalendarRange size={18} /></span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Ciclo visualizado</p>
                <div className="relative mt-0.5">
                  <select
                    className="appearance-none bg-transparent pr-6 text-lg font-black text-[#00704A] outline-none"
                    value={selectedCycleId}
                    onChange={(event) => setSelectedCycleId(event.target.value)}
                  >
                    {cycles.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                  <ChevronDown size={14} className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-[#00704A]" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <IosBadge status={cycle.status} />
              <span className="text-xs text-gray-400">{fmtDate(cycle.startDate)} — {fmtDate(cycle.endDate)}</span>
              {cycle.status !== "ACTIVE" && cycle.status !== "ARCHIVED" && (
                <IosButton variant="secondary" onClick={() => patchCycle({ status: "ACTIVE" })}>Ativar ciclo</IosButton>
              )}
            </div>
          </div>

          <section className="mb-6 rounded-3xl border border-[#E3DED3] bg-white">
            <div className="flex flex-col justify-between gap-3 border-b border-[#EEEAE1] px-5 py-4 sm:flex-row sm:items-center">
              <div>
                <p className="flex items-center gap-2 text-sm font-black text-[#00704A]"><Target size={16} /> Objetivos e resultados-chave</p>
                <p className="mt-0.5 text-xs text-gray-400">KRs medem o objetivo usando o catálogo oficial.</p>
              </div>
              <IosButton variant="secondary" onClick={openObjective}><Plus size={14} /> Objetivo</IosButton>
            </div>
            <div className="space-y-4 p-5">
              {cycle.objectives.length === 0 ? (
                <IosEmpty title="Nenhum objetivo neste ciclo" description="Defina resultados, não apenas atividades." />
              ) : cycle.objectives.map((objective) => (
                <article key={objective.id} className="overflow-hidden rounded-2xl border border-[#E8E4DA]">
                  <div className="bg-[#FAF9F6] p-4">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <h3 className="font-black text-gray-800">{objective.title}</h3>
                          <IosBadge status={objective.status} />
                        </div>
                        {objective.description && <p className="text-sm text-gray-500">{objective.description}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusSelect value={objective.status} values={OBJECTIVE_STATUS} onChange={(status) => patchObjective(objective.id, { status })} />
                        <IosButton variant="secondary" onClick={() => openKeyResult(objective)} disabled={!metrics.length}><Plus size={13} /> KR</IosButton>
                      </div>
                    </div>
                    <div className="mt-4"><IosProgress value={objective.progress} /></div>
                  </div>
                  <div className="divide-y divide-[#EEEAE1]">
                    {objective.keyResults.length === 0 ? (
                      <p className="px-4 py-3 text-xs text-gray-400">{metrics.length ? "Sem resultados-chave." : "Crie uma métrica antes de adicionar KRs."}</p>
                    ) : objective.keyResults.map((keyResult) => (
                      <div key={keyResult.id} className="grid gap-3 px-4 py-4 md:grid-cols-[1fr_auto_auto] md:items-center">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-bold text-gray-700">{keyResult.title}</p>
                            <IosBadge status={keyResult.status} />
                          </div>
                          <p className="mt-1 text-[11px] text-gray-400">
                            {keyResult.metric.name} · {fmtMetric(keyResult.baseline, keyResult.metric.unit)} → {fmtMetric(keyResult.target, keyResult.metric.unit)}
                          </p>
                        </div>
                        <IosProgress value={keyResult.progress} compact />
                        <StatusSelect
                          value={keyResult.status}
                          values={["DRAFT", "ACTIVE", "AT_RISK", "ACHIEVED", "CANCELED"]}
                          onChange={(status) => patchKeyResult(keyResult.id, { status })}
                        />
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-[#E3DED3] bg-white">
            <div className="flex flex-col justify-between gap-3 border-b border-[#EEEAE1] px-5 py-4 sm:flex-row sm:items-center">
              <div>
                <p className="flex items-center gap-2 text-sm font-black text-[#00704A]"><Rocket size={16} /> Iniciativas e marcos</p>
                <p className="mt-0.5 text-xs text-gray-400">Execução estratégica ligada às Tasks, sem duplicar o kanban.</p>
              </div>
              <IosButton variant="secondary" onClick={openInitiative}><Plus size={14} /> Iniciativa</IosButton>
            </div>
            <div className="grid gap-4 p-5 lg:grid-cols-2">
              {cycle.initiatives.length === 0 ? (
                <div className="lg:col-span-2"><IosEmpty title="Nenhuma iniciativa" description="Crie frentes de execução que movem os objetivos do ciclo." /></div>
              ) : cycle.initiatives.map((initiative) => (
                <article key={initiative.id} className="rounded-2xl border border-[#E8E4DA] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-black text-gray-800">{initiative.title}</h3>
                        <IosBadge status={initiative.status} />
                      </div>
                      {initiative.description && <p className="mt-1 line-clamp-2 text-xs text-gray-500">{initiative.description}</p>}
                    </div>
                    <StatusSelect value={initiative.status} values={INITIATIVE_STATUS} onChange={(status) => patchInitiative(initiative.id, { status })} />
                  </div>
                  <div className="my-4"><IosProgress value={initiative.progress} /></div>

                  <div className="mb-4 rounded-xl bg-[#F8F6F1] p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide text-gray-400"><Flag size={12} /> Marcos</p>
                      <button className="text-[11px] font-bold text-[#00704A]" onClick={() => openMilestone(initiative)}>+ Adicionar</button>
                    </div>
                    {initiative.milestones.length === 0 ? <p className="text-xs text-gray-400">Nenhum marco.</p> : (
                      <div className="space-y-2">
                        {initiative.milestones.map((milestone) => (
                          <button key={milestone.id} onClick={() => toggleMilestone(milestone)} className="flex w-full items-start gap-2 text-left">
                            {milestone.status === "COMPLETED" ? <Check size={15} className="mt-0.5 shrink-0 text-[#00704A]" /> : <Circle size={15} className="mt-0.5 shrink-0 text-gray-300" />}
                            <span className={`text-xs ${milestone.status === "COMPLETED" ? "text-gray-400 line-through" : "text-gray-600"}`}>
                              {milestone.title}{milestone.dueDate ? ` · ${fmtDate(milestone.dueDate)}` : ""}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-[#EEEAE1] p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide text-gray-400"><Link2 size={12} /> Tasks vinculadas</p>
                      <button className="text-[11px] font-bold text-[#00704A]" onClick={() => openTaskLink(initiative)}>+ Vincular</button>
                    </div>
                    {initiative.taskLinks.length === 0 ? <p className="text-xs text-gray-400">Nenhuma task vinculada.</p> : (
                      <div className="space-y-2">
                        {initiative.taskLinks.map((link) => (
                          <div key={link.taskId} className="flex items-center justify-between gap-2">
                            <p className="truncate text-xs text-gray-600">#{link.task.number} · {link.task.title}</p>
                            <button onClick={() => unlinkTask(initiative.id, link.taskId)} title="Remover vínculo" className="text-gray-300 hover:text-red-500"><Unlink size={13} /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        </>
      )}

      <IosModal open={Boolean(modal)} title={
        modal?.type === "cycle" ? "Novo ciclo estratégico"
          : modal?.type === "objective" ? "Novo objetivo"
            : modal?.type === "keyResult" ? "Novo resultado-chave"
              : modal?.type === "initiative" ? "Nova iniciativa"
                : modal?.type === "milestone" ? "Novo marco"
                  : "Vincular task"
      } onClose={() => setModal(null)} width="max-w-2xl">
        {modal && (
          <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
            {modal.type === "cycle" && (
              <>
                <IosField label="Nome"><input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></IosField>
                <IosField label="Cadência">
                  <select className={inputClass} value={form.cadence} onChange={(e) => setForm({ ...form, cadence: e.target.value })}>
                    <option value="QUARTERLY">Trimestral</option><option value="SEMIANNUAL">Semestral</option><option value="ANNUAL">Anual</option><option value="CUSTOM">Personalizado</option>
                  </select>
                </IosField>
                <IosField label="Início"><input type="date" className={inputClass} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required /></IosField>
                <IosField label="Fim"><input type="date" className={inputClass} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required /></IosField>
                <div className="md:col-span-2"><IosField label="Descrição"><textarea className={`${inputClass} min-h-20`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></IosField></div>
              </>
            )}
            {modal.type === "objective" && (
              <>
                <div className="md:col-span-2"><IosField label="Objetivo"><input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex.: Validar aquisição repetível" required /></IosField></div>
                <div className="md:col-span-2"><IosField label="Descrição"><textarea className={`${inputClass} min-h-24`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></IosField></div>
              </>
            )}
            {modal.type === "keyResult" && (
              <>
                <div className="md:col-span-2"><IosField label="Resultado-chave"><input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex.: Atingir R$ 10 mil de MRR" required /></IosField></div>
                <div className="md:col-span-2"><IosField label="Métrica oficial">
                  <select className={inputClass} value={form.metricId} onChange={(e) => setForm({ ...form, metricId: e.target.value })} required>
                    {metrics.map((metric) => <option key={metric.id} value={metric.id}>{metric.name} · {metric.code}</option>)}
                  </select>
                </IosField></div>
                <IosField label="Baseline"><input type="number" step="0.000001" className={inputClass} value={form.baseline} onChange={(e) => setForm({ ...form, baseline: e.target.value })} required /></IosField>
                <IosField label="Alvo"><input type="number" step="0.000001" className={inputClass} value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} required /></IosField>
                <IosField label="Início"><input type="date" className={inputClass} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required /></IosField>
                <IosField label="Prazo"><input type="date" className={inputClass} value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} required /></IosField>
              </>
            )}
            {modal.type === "initiative" && (
              <>
                <div className="md:col-span-2"><IosField label="Iniciativa"><input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></IosField></div>
                <div className="md:col-span-2"><IosField label="Descrição"><textarea className={`${inputClass} min-h-20`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></IosField></div>
                <IosField label="Objetivo relacionado">
                  <select className={inputClass} value={form.objectiveId} onChange={(e) => setForm({ ...form, objectiveId: e.target.value })}>
                    <option value="">Sem objetivo</option>{cycle.objectives.map((objective) => <option key={objective.id} value={objective.id}>{objective.title}</option>)}
                  </select>
                </IosField>
                <IosField label="Prioridade">
                  <select className={inputClass} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                    <option value="LOW">Baixa</option><option value="MEDIUM">Média</option><option value="HIGH">Alta</option><option value="CRITICAL">Crítica</option>
                  </select>
                </IosField>
                <IosField label="Início"><input type="date" className={inputClass} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></IosField>
                <IosField label="Prazo"><input type="date" className={inputClass} value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></IosField>
              </>
            )}
            {modal.type === "milestone" && (
              <>
                <div className="md:col-span-2"><IosField label="Marco"><input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></IosField></div>
                <IosField label="Prazo"><input type="date" className={inputClass} value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></IosField>
              </>
            )}
            {modal.type === "task" && (
              <div className="md:col-span-2">
                {modal.available.length ? (
                  <IosField label="Task existente">
                    <select className={inputClass} value={form.taskId} onChange={(e) => setForm({ ...form, taskId: e.target.value })} required>
                      {modal.available.map((task) => <option key={task.id} value={task.id}>#{task.number} · {task.title}</option>)}
                    </select>
                  </IosField>
                ) : <IosEmpty title="Todas as tasks já estão vinculadas" />}
              </div>
            )}
            <div className="flex justify-end gap-2 md:col-span-2">
              <IosButton variant="ghost" onClick={() => setModal(null)}>Cancelar</IosButton>
              {modal.type !== "task" || modal.available.length > 0 ? <IosButton type="submit" disabled={saving}>{saving ? "Salvando…" : "Salvar"}</IosButton> : null}
            </div>
          </form>
        )}
      </IosModal>
    </IosLayout>
  );
}
