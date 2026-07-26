import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowRight,
  Banknote,
  Building2,
  CalendarRange,
  CheckCircle2,
  CircleAlert,
  Flag,
  Gauge,
  Pencil,
  Plus,
  Megaphone,
  Rocket,
  Scale,
  Target,
  Users,
} from "lucide-react";
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
import { fmtDate, fmtMetric } from "../iosFormat";

function SummaryCard({ label, value, detail, icon: Icon, warning }) {
  return (
    <div className={`rounded-2xl border bg-white p-4 ${warning ? "border-amber-200" : "border-[#E3DED3]"}`}>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wide text-gray-400">{label}</span>
        <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${warning ? "bg-amber-50 text-amber-600" : "bg-[#E6F3EE] text-[#00704A]"}`}>
          <Icon size={16} />
        </span>
      </div>
      <p className={`text-2xl font-black ${warning ? "text-amber-600" : "text-[#00704A]"}`}>{value}</p>
      {detail && <p className="mt-1 text-[11px] text-gray-400">{detail}</p>}
    </div>
  );
}

function WorkspaceForm({ workspace, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: workspace.name ?? "Iaso",
    mission: workspace.mission ?? "",
    vision: workspace.vision ?? "",
    values: Array.isArray(workspace.values) ? workspace.values.join("\n") : "",
  });
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await iosApi.updateWorkspace({
        name: form.name,
        mission: form.mission || null,
        vision: form.vision || null,
        values: form.values.split("\n").map((value) => value.trim()).filter(Boolean),
      });
      toast.success("Fundação estratégica atualizada.");
      onSaved();
      onClose();
    } catch (error) {
      toast.error(iosError(error, "Erro ao atualizar a fundação estratégica."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <IosField label="Nome da organização">
        <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={120} required />
      </IosField>
      <IosField label="Missão" hint="Por que a Iaso existe hoje?">
        <textarea className={`${inputClass} min-h-24 resize-y`} value={form.mission} onChange={(e) => setForm({ ...form, mission: e.target.value })} maxLength={3000} />
      </IosField>
      <IosField label="Visão" hint="Que futuro a empresa quer construir?">
        <textarea className={`${inputClass} min-h-24 resize-y`} value={form.vision} onChange={(e) => setForm({ ...form, vision: e.target.value })} maxLength={3000} />
      </IosField>
      <IosField label="Valores" hint="Um valor por linha.">
        <textarea className={`${inputClass} min-h-28 resize-y`} value={form.values} onChange={(e) => setForm({ ...form, values: e.target.value })} />
      </IosField>
      <div className="flex justify-end gap-2">
        <IosButton variant="ghost" onClick={onClose}>Cancelar</IosButton>
        <IosButton type="submit" disabled={saving}>{saving ? "Salvando…" : "Salvar fundação"}</IosButton>
      </div>
    </form>
  );
}

export default function IosCockpit() {
  const [workspaceState, setWorkspaceState] = useState(null);
  const [data, setData] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [initializing, setInitializing] = useState(false);
  const [editWorkspace, setEditWorkspace] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const workspaceResponse = await iosApi.workspace();
      setWorkspaceState(workspaceResponse.data);
      if (workspaceResponse.data.initialized) {
        const [cockpitResponse, performanceResponse] = await Promise.all([
          iosApi.cockpit(),
          iosApi.performance(),
        ]);
        setData(cockpitResponse.data);
        setPerformance(performanceResponse.data);
      } else {
        setData(null);
        setPerformance(null);
      }
    } catch (requestError) {
      setError(iosError(requestError, "Não foi possível carregar o IOS."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function initialize() {
    setInitializing(true);
    try {
      await iosApi.bootstrap();
      toast.success("IASO Operating System inicializado.");
      await load();
      setEditWorkspace(true);
    } catch (requestError) {
      toast.error(iosError(requestError, "Não foi possível inicializar o IOS."));
    } finally {
      setInitializing(false);
    }
  }

  if (loading) {
    return <IosLayout title="Cockpit Executivo" subtitle="Estratégia, indicadores e decisões em um só lugar."><IosLoading /></IosLayout>;
  }

  if (error) {
    return <IosLayout title="Cockpit Executivo" subtitle="Estratégia, indicadores e decisões em um só lugar."><IosError message={error} onRetry={load} /></IosLayout>;
  }

  if (!workspaceState?.initialized) {
    return (
      <IosLayout title="Cockpit Executivo" subtitle="Estratégia, indicadores e decisões em um só lugar.">
        <div className="overflow-hidden rounded-3xl border border-[#DCE8E2] bg-white">
          <div className="grid gap-8 p-8 md:grid-cols-[1.3fr_1fr] md:p-12">
            <div>
              <span className="mb-4 inline-flex rounded-full bg-[#E6F3EE] px-3 py-1 text-xs font-bold text-[#00704A]">Primeira configuração</span>
              <h2 className="text-3xl font-black leading-tight text-[#06251B]">
                Transforme dados operacionais em decisões rastreáveis.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-gray-500">
                A inicialização cria o workspace interno da Iaso e vincula somente o seu usuário como proprietário. Nenhum dado de clínica é alterado.
              </p>
              <IosButton className="mt-6" onClick={initialize} disabled={initializing}>
                <Rocket size={16} /> {initializing ? "Inicializando…" : "Inicializar IOS"}
              </IosButton>
            </div>
            <div className="rounded-3xl bg-[#F2F0EB] p-6">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400">O que será habilitado</p>
              <div className="mt-4 space-y-3">
                {[
                  [Target, "Objetivos, KRs e iniciativas"],
                  [Gauge, "Catálogo de métricas com origem"],
                  [Scale, "Registro de decisões"],
                  [Flag, "Marcos ligados às Tasks"],
                ].map(([Icon, label]) => (
                  <div key={label} className="flex items-center gap-3 text-sm font-semibold text-gray-700">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-[#00704A]"><Icon size={15} /></span>
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </IosLayout>
    );
  }

  const workspace = data.workspace;
  const cycle = data.activeCycle;
  const summary = data.summary;

  return (
    <IosLayout
      title="Cockpit Executivo"
      subtitle="O que precisa da sua atenção agora, com contexto e origem."
      actions={
        <>
          <IosButton variant="secondary" onClick={() => setEditWorkspace(true)}><Pencil size={14} /> Fundação</IosButton>
          <Link to="/ios/strategy"><IosButton><Plus size={14} /> Planejar</IosButton></Link>
        </>
      }
    >
      <section className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-[#E3DED3] bg-white p-5">
          <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-400"><Building2 size={14} /> Missão</p>
          <p className="text-sm leading-relaxed text-gray-700">{workspace.mission || "Ainda não definida."}</p>
        </div>
        <div className="rounded-2xl border border-[#E3DED3] bg-white p-5">
          <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-400"><Target size={14} /> Visão</p>
          <p className="text-sm leading-relaxed text-gray-700">{workspace.vision || "Ainda não definida."}</p>
        </div>
        <div className="rounded-2xl border border-[#E3DED3] bg-white p-5">
          <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-400"><CheckCircle2 size={14} /> Valores</p>
          {Array.isArray(workspace.values) && workspace.values.length ? (
            <div className="flex flex-wrap gap-1.5">
              {workspace.values.map((value) => <span key={value} className="rounded-full bg-[#E6F3EE] px-2.5 py-1 text-xs font-semibold text-[#00704A]">{value}</span>)}
            </div>
          ) : <p className="text-sm text-gray-500">Ainda não definidos.</p>}
        </div>
      </section>

      <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-6">
        <SummaryCard label="Objetivos" value={summary.objectives} icon={Target} />
        <SummaryCard label="No caminho" value={summary.onTrack} icon={CheckCircle2} />
        <SummaryCard label="Em risco" value={summary.atRisk} icon={CircleAlert} warning={summary.atRisk > 0} />
        <SummaryCard label="Iniciativas" value={summary.initiatives} icon={Rocket} />
        <SummaryCard label="Bloqueadas" value={summary.blockedInitiatives} icon={CircleAlert} warning={summary.blockedInitiatives > 0} />
        <SummaryCard label="Marcos pend." value={summary.pendingMilestones} icon={Flag} />
      </section>

      {performance && (
        <section className="mb-6 rounded-3xl border border-[#E3DED3] bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-[#00704A]">Pulso do negócio</h2>
              <p className="mt-0.5 text-xs text-gray-400">Dados oficiais do período {performance.period.key}.</p>
            </div>
            <Link to="/ios/performance" className="flex items-center gap-1 text-xs font-bold text-[#00704A]">Analisar <ArrowRight size={13} /></Link>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <SummaryCard label="MRR" value={fmtMetric(performance.growth.mrr, "BRL")} detail="normalizado" icon={Banknote} />
            <SummaryCard label="Clínicas ativas" value={performance.growth.activeClinics} detail={`${performance.growth.newClinics} novas no período`} icon={Users} />
            <SummaryCard label="Resultado" value={fmtMetric(performance.finance.result, "BRL")} detail={`${fmtMetric(performance.finance.margin, "PERCENTAGE")} de margem`} icon={Building2} warning={performance.finance.result < 0} />
            <SummaryCard label="Pipeline" value={fmtMetric(performance.commercial.activeValue, "BRL")} detail={`${fmtMetric(performance.commercial.conversionRate, "PERCENTAGE")} de conversão`} icon={Megaphone} />
          </div>
        </section>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-[#E3DED3] bg-white">
            <div className="flex items-center justify-between border-b border-[#EEEAE1] px-5 py-4">
              <div>
                <p className="text-sm font-black text-[#00704A]">Ciclo estratégico</p>
                {cycle && <p className="mt-0.5 text-xs text-gray-400">{fmtDate(cycle.startDate)} — {fmtDate(cycle.endDate)}</p>}
              </div>
              {cycle && <IosBadge status={cycle.status} />}
            </div>
            <div className="p-5">
              {!cycle ? (
                <IosEmpty
                  title="Nenhum ciclo estratégico"
                  description="Crie o primeiro trimestre para começar a ligar objetivos, métricas e execução."
                  action={<Link to="/ios/strategy"><IosButton><Plus size={14} /> Criar ciclo</IosButton></Link>}
                />
              ) : cycle.objectives.length === 0 ? (
                <IosEmpty title={cycle.name} description="O ciclo existe, mas ainda não possui objetivos." action={<Link to="/ios/strategy"><IosButton>Adicionar objetivo</IosButton></Link>} />
              ) : (
                <div className="space-y-3">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-black text-gray-800">{cycle.name}</h3>
                    <Link to="/ios/strategy" className="flex items-center gap-1 text-xs font-bold text-[#00704A]">Abrir estratégia <ArrowRight size={13} /></Link>
                  </div>
                  {cycle.objectives.map((objective) => (
                    <div key={objective.id} className="rounded-2xl border border-[#ECE8DF] bg-[#FAF9F6] p-4">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-gray-800">{objective.title}</p>
                          <p className="mt-0.5 text-xs text-gray-400">{objective.keyResults.length} resultado(s)-chave</p>
                        </div>
                        <IosBadge status={objective.status} />
                      </div>
                      <IosProgress value={objective.progress} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-[#E3DED3] bg-white">
            <div className="flex items-center justify-between border-b border-[#EEEAE1] px-5 py-4">
              <p className="text-sm font-black text-[#00704A]">Métricas oficiais</p>
              <Link to="/ios/metrics" className="flex items-center gap-1 text-xs font-bold text-[#00704A]">Catálogo <ArrowRight size={13} /></Link>
            </div>
            <div className="grid gap-3 p-5 sm:grid-cols-2">
              {data.metrics.length === 0 ? (
                <div className="sm:col-span-2"><IosEmpty title="Catálogo vazio" description="Crie métricas com definição, unidade, fonte e responsável." /></div>
              ) : data.metrics.slice(0, 6).map((metric) => (
                <div key={metric.id} className="rounded-2xl border border-[#ECE8DF] p-4">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-400">{metric.code}</p>
                      <p className="mt-0.5 font-bold text-gray-800">{metric.name}</p>
                    </div>
                    <Gauge size={16} className="text-[#A9DEC8]" />
                  </div>
                  <p className="text-xl font-black text-[#00704A]">{fmtMetric(metric.currentObservation?.value, metric.unit)}</p>
                  <p className="mt-2 truncate text-[11px] text-gray-400">Fonte: {metric.sourceRef}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-3xl border border-[#E3DED3] bg-white">
            <div className="flex items-center justify-between border-b border-[#EEEAE1] px-5 py-4">
              <p className="text-sm font-black text-[#00704A]">Decisões recentes</p>
              <Link to="/ios/decisions" className="flex items-center gap-1 text-xs font-bold text-[#00704A]">Ver todas <ArrowRight size={13} /></Link>
            </div>
            <div className="p-5">
              {data.recentDecisions.length === 0 ? (
                <IosEmpty title="Nenhuma decisão registrada" description="Preserve o contexto e o porquê das escolhas importantes." />
              ) : (
                <div className="space-y-3">
                  {data.recentDecisions.map((decision) => (
                    <div key={decision.id} className="rounded-2xl border border-[#ECE8DF] p-4">
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <p className="text-sm font-bold text-gray-800">{decision.title}</p>
                        <IosBadge status={decision.status} />
                      </div>
                      <p className="line-clamp-2 text-xs leading-relaxed text-gray-500">{decision.decision}</p>
                      <p className="mt-2 text-[10px] text-gray-400">{fmtDate(decision.createdAt)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-[#E3DED3] bg-white">
            <div className="border-b border-[#EEEAE1] px-5 py-4">
              <p className="text-sm font-black text-[#00704A]">Memória recente</p>
            </div>
            <div className="p-5">
              {data.audit.length === 0 ? <p className="text-sm text-gray-400">Nenhuma alteração registrada.</p> : (
                <div className="space-y-4">
                  {data.audit.slice(0, 6).map((entry) => (
                    <div key={entry.id} className="relative border-l-2 border-[#DDEBE5] pl-4">
                      <span className="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-[#00704A]" />
                      <p className="text-xs font-semibold text-gray-700">{entry.action}</p>
                      <p className="mt-0.5 text-[10px] text-gray-400">{entry.actorName || "Sistema"} · {fmtDate(entry.createdAt, { hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      <IosModal open={editWorkspace} title="Fundação estratégica" subtitle="Missão, visão e valores vigentes da Iaso." onClose={() => setEditWorkspace(false)}>
        {editWorkspace && <WorkspaceForm workspace={workspace} onClose={() => setEditWorkspace(false)} onSaved={load} />}
      </IosModal>
    </IosLayout>
  );
}
