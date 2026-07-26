import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { BookOpen, CalendarPlus, Gauge, Plus, RefreshCw, Search } from "lucide-react";
import IosLayout from "../components/IosLayout";
import {
  IosButton,
  IosEmpty,
  IosError,
  IosField,
  IosLoading,
  IosModal,
  inputClass,
} from "../components/IosUi";
import { iosApi, iosError } from "../iosApi";
import { fmtDate, fmtMetric, inputDate } from "../iosFormat";

const UNIT_LABEL = {
  NUMBER: "Número",
  BRL: "Real (R$)",
  PERCENTAGE: "Percentual",
  DAYS: "Dias",
  MONTHS: "Meses",
  SCORE: "Score",
};

const SOURCE_LABEL = {
  MANUAL: "Manual",
  CALCULATED: "Calculada",
  IMPORTED: "Importada",
  EXTERNAL: "Externa",
};

const EMPTY_METRIC = {
  code: "",
  name: "",
  description: "",
  unit: "NUMBER",
  direction: "INCREASE",
  frequency: "MONTHLY",
  sourceType: "MANUAL",
  sourceRef: "",
  formulaKey: "",
  formulaVersion: "",
  allowManualInput: true,
};

function monthRange() {
  const now = new Date();
  return {
    periodStart: inputDate(new Date(now.getFullYear(), now.getMonth(), 1)),
    periodEnd: inputDate(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  };
}

export default function IosMetrics() {
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [metricForm, setMetricForm] = useState(EMPTY_METRIC);
  const [saving, setSaving] = useState(false);
  const [observationMetric, setObservationMetric] = useState(null);
  const [observation, setObservation] = useState({ ...monthRange(), value: "", sourceRef: "", note: "" });

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await iosApi.metrics();
      setMetrics(response.data);
    } catch (requestError) {
      setError(iosError(requestError, "Não foi possível carregar o catálogo de métricas."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return metrics;
    return metrics.filter((metric) =>
      [metric.name, metric.code, metric.description, metric.sourceRef]
        .some((value) => value?.toLowerCase().includes(term))
    );
  }, [metrics, search]);

  async function createMetric(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...metricForm,
        formulaKey: metricForm.sourceType === "CALCULATED" ? metricForm.formulaKey : null,
        formulaVersion: metricForm.sourceType === "CALCULATED" ? metricForm.formulaVersion : null,
        allowManualInput: metricForm.sourceType === "CALCULATED" ? false : metricForm.allowManualInput,
      };
      await iosApi.createMetric(payload);
      toast.success("Métrica adicionada ao catálogo.");
      setShowCreate(false);
      setMetricForm(EMPTY_METRIC);
      await load();
    } catch (requestError) {
      toast.error(iosError(requestError, "Não foi possível criar a métrica."));
    } finally {
      setSaving(false);
    }
  }

  function openObservation(metric) {
    setObservationMetric(metric);
    setObservation({
      ...monthRange(),
      value: "",
      sourceRef: metric.sourceRef || "",
      note: "",
    });
  }

  async function createObservation(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await iosApi.createObservation(observationMetric.id, observation);
      toast.success("Medição registrada com origem e período.");
      setObservationMetric(null);
      await load();
    } catch (requestError) {
      toast.error(iosError(requestError, "Não foi possível registrar a medição."));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <IosLayout title="Catálogo de Métricas" subtitle="Uma definição oficial para cada número usado pela empresa."><IosLoading /></IosLayout>;
  }

  if (error) {
    return <IosLayout title="Catálogo de Métricas" subtitle="Uma definição oficial para cada número usado pela empresa."><IosError message={error} onRetry={load} /></IosLayout>;
  }

  return (
    <IosLayout
      title="Catálogo de Métricas"
      subtitle="Definição, fonte, período e fórmula antes do dashboard."
      actions={<IosButton onClick={() => setShowCreate(true)}><Plus size={15} /> Nova métrica</IosButton>}
    >
      <div className="mb-5 grid gap-3 md:grid-cols-[1fr_auto]">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
          <input className={`${inputClass} pl-9`} placeholder="Buscar por nome, código ou fonte…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <IosButton variant="secondary" onClick={load}><RefreshCw size={14} /> Atualizar</IosButton>
      </div>

      {filtered.length === 0 ? (
        <IosEmpty
          title={metrics.length ? "Nenhuma métrica encontrada" : "O catálogo ainda está vazio"}
          description="Comece por indicadores que já possuem fonte verificável. CAC e LTV devem esperar até os dados necessários existirem."
          action={!metrics.length && <IosButton onClick={() => setShowCreate(true)}><Plus size={14} /> Criar primeira métrica</IosButton>}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((metric) => (
            <article key={metric.id} className={`rounded-3xl border bg-white p-5 ${metric.isActive ? "border-[#E3DED3]" : "border-gray-200 opacity-60"}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.13em] text-[#C4895A]">{metric.code}</p>
                  <h2 className="mt-1 text-lg font-black text-[#00704A]">{metric.name}</h2>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#E6F3EE] text-[#00704A]"><Gauge size={18} /></span>
              </div>
              <p className="mt-3 min-h-10 text-sm leading-relaxed text-gray-500">{metric.description}</p>

              <div className="my-4 rounded-2xl bg-[#F6F4EF] p-4">
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Valor atual</p>
                <p className="mt-1 text-2xl font-black text-[#06251B]">{fmtMetric(metric.currentObservation?.value, metric.unit)}</p>
                <p className="mt-1 text-[11px] text-gray-400">
                  {metric.currentObservation ? `${fmtDate(metric.currentObservation.periodStart)} — ${fmtDate(metric.currentObservation.periodEnd)}` : "Nenhuma observação registrada"}
                </p>
              </div>

              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                <div><dt className="text-gray-400">Unidade</dt><dd className="mt-0.5 font-semibold text-gray-700">{UNIT_LABEL[metric.unit]}</dd></div>
                <div><dt className="text-gray-400">Origem</dt><dd className="mt-0.5 font-semibold text-gray-700">{SOURCE_LABEL[metric.sourceType]}</dd></div>
                <div><dt className="text-gray-400">Frequência</dt><dd className="mt-0.5 font-semibold text-gray-700">{metric.frequency}</dd></div>
                <div><dt className="text-gray-400">Tendência</dt><dd className="mt-0.5 font-semibold text-gray-700">{metric.trend === "NO_DATA" ? "Sem histórico" : metric.trend}</dd></div>
              </dl>

              <div className="mt-4 rounded-xl border border-[#EEEAE1] p-3">
                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-gray-400"><BookOpen size={12} /> Fonte oficial</p>
                <p className="mt-1 break-words text-xs text-gray-600">{metric.sourceRef}</p>
                {metric.formulaKey && <p className="mt-1 text-[10px] text-gray-400">Fórmula: {metric.formulaKey} · v{metric.formulaVersion}</p>}
              </div>

              {metric.allowManualInput && (
                <IosButton variant="secondary" className="mt-4 w-full" onClick={() => openObservation(metric)}>
                  <CalendarPlus size={14} /> Registrar medição
                </IosButton>
              )}
            </article>
          ))}
        </div>
      )}

      <IosModal open={showCreate} title="Nova métrica oficial" subtitle="O código e o significado devem permanecer estáveis." onClose={() => setShowCreate(false)} width="max-w-2xl">
        <form onSubmit={createMetric} className="grid gap-4 md:grid-cols-2">
          <IosField label="Código" hint="Ex.: growth.mrr ou strategy.nps">
            <input className={inputClass} value={metricForm.code} onChange={(e) => setMetricForm({ ...metricForm, code: e.target.value.toLowerCase() })} placeholder="growth.metric_name" required />
          </IosField>
          <IosField label="Nome">
            <input className={inputClass} value={metricForm.name} onChange={(e) => setMetricForm({ ...metricForm, name: e.target.value })} required />
          </IosField>
          <div className="md:col-span-2">
            <IosField label="Definição" hint="Explique população, janela e significado do indicador.">
              <textarea className={`${inputClass} min-h-24 resize-y`} value={metricForm.description} onChange={(e) => setMetricForm({ ...metricForm, description: e.target.value })} required />
            </IosField>
          </div>
          <IosField label="Unidade">
            <select className={inputClass} value={metricForm.unit} onChange={(e) => setMetricForm({ ...metricForm, unit: e.target.value })}>
              {Object.entries(UNIT_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </IosField>
          <IosField label="Direção desejada">
            <select className={inputClass} value={metricForm.direction} onChange={(e) => setMetricForm({ ...metricForm, direction: e.target.value })}>
              <option value="INCREASE">Aumentar</option>
              <option value="DECREASE">Reduzir</option>
              <option value="MAINTAIN">Manter faixa</option>
            </select>
          </IosField>
          <IosField label="Frequência">
            <select className={inputClass} value={metricForm.frequency} onChange={(e) => setMetricForm({ ...metricForm, frequency: e.target.value })}>
              {["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "ANNUAL", "ON_DEMAND"].map((value) => <option key={value}>{value}</option>)}
            </select>
          </IosField>
          <IosField label="Tipo de origem">
            <select
              className={inputClass}
              value={metricForm.sourceType}
              onChange={(e) => {
                const sourceType = e.target.value;
                setMetricForm({ ...metricForm, sourceType, allowManualInput: sourceType === "MANUAL" });
              }}
            >
              {Object.entries(SOURCE_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </IosField>
          <div className="md:col-span-2">
            <IosField label="Fonte oficial" hint="Tabela, relatório, integração ou documento que comprova o valor.">
              <input className={inputClass} value={metricForm.sourceRef} onChange={(e) => setMetricForm({ ...metricForm, sourceRef: e.target.value })} required />
            </IosField>
          </div>
          {metricForm.sourceType === "CALCULATED" && (
            <>
              <IosField label="Chave da fórmula">
                <input className={inputClass} value={metricForm.formulaKey} onChange={(e) => setMetricForm({ ...metricForm, formulaKey: e.target.value })} placeholder="growth.mrr" required />
              </IosField>
              <IosField label="Versão da fórmula">
                <input className={inputClass} value={metricForm.formulaVersion} onChange={(e) => setMetricForm({ ...metricForm, formulaVersion: e.target.value })} placeholder="1" required />
              </IosField>
            </>
          )}
          <div className="flex justify-end gap-2 md:col-span-2">
            <IosButton variant="ghost" onClick={() => setShowCreate(false)}>Cancelar</IosButton>
            <IosButton type="submit" disabled={saving}>{saving ? "Criando…" : "Criar métrica"}</IosButton>
          </div>
        </form>
      </IosModal>

      <IosModal open={Boolean(observationMetric)} title={`Registrar ${observationMetric?.name ?? "medição"}`} subtitle="O valor fica associado ao período e à fonte informados." onClose={() => setObservationMetric(null)}>
        <form onSubmit={createObservation} className="space-y-4">
          <IosField label="Valor">
            <input type="number" step="0.000001" className={inputClass} value={observation.value} onChange={(e) => setObservation({ ...observation, value: e.target.value })} required />
          </IosField>
          <div className="grid grid-cols-2 gap-3">
            <IosField label="Início do período">
              <input type="date" className={inputClass} value={observation.periodStart} onChange={(e) => setObservation({ ...observation, periodStart: e.target.value })} required />
            </IosField>
            <IosField label="Fim do período">
              <input type="date" className={inputClass} value={observation.periodEnd} onChange={(e) => setObservation({ ...observation, periodEnd: e.target.value })} required />
            </IosField>
          </div>
          <IosField label="Fonte/referência">
            <input className={inputClass} value={observation.sourceRef} onChange={(e) => setObservation({ ...observation, sourceRef: e.target.value })} required />
          </IosField>
          <IosField label="Nota" hint="Opcional: explique ajuste, arredondamento ou contexto.">
            <textarea className={`${inputClass} min-h-20 resize-y`} value={observation.note} onChange={(e) => setObservation({ ...observation, note: e.target.value })} />
          </IosField>
          <div className="flex justify-end gap-2">
            <IosButton variant="ghost" onClick={() => setObservationMetric(null)}>Cancelar</IosButton>
            <IosButton type="submit" disabled={saving}>{saving ? "Registrando…" : "Registrar medição"}</IosButton>
          </div>
        </form>
      </IosModal>
    </IosLayout>
  );
}
