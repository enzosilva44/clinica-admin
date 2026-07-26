import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Banknote,
  Building2,
  Calculator,
  CircleDollarSign,
  Coins,
  Flame,
  Gauge,
  LineChart,
  Percent,
  Plus,
  RefreshCw,
  Rocket,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  WalletCards,
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
  inputClass,
} from "../components/IosUi";
import { iosApi, iosError } from "../iosApi";
import { fmtMetric, inputDate } from "../iosFormat";

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function horizon() {
  const start = new Date();
  start.setDate(1);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 11, 28);
  return { horizonStart: inputDate(start), horizonEnd: inputDate(end) };
}

function assumptionsFrom(data) {
  const items = [
    ["startingCash", "Caixa inicial", data?.finance?.cashBalance ?? 0, "BRL", "Saldo registrado no Financeiro"],
    ["startingMrr", "MRR inicial", data?.growth?.mrr ?? 0, "BRL", "MRR oficial do período"],
    ["monthlyGrowthRate", "Crescimento mensal", 0, "PERCENTAGE", "Premissa definida pelo fundador"],
    ["monthlyChurnRate", "Churn mensal", data?.growth?.logoChurn ?? 0, "PERCENTAGE", "Churn observado ou premissa"],
    ["fixedCosts", "Custos fixos mensais", data?.finance?.costs ?? 0, "BRL", "Custos registrados no período"],
    ["variableCostRate", "Custos variáveis", 0, "PERCENTAGE", "Percentual sobre receita"],
  ];
  return items.map(([key, label, value, unit, sourceRef], sortOrder) => ({
    key, label, value: String(value ?? 0), unit, sourceRef, justification: "", sortOrder,
  }));
}

function MetricCard({ label, value, unit, detail, icon: Icon, warning }) {
  return (
    <article className={`rounded-2xl border bg-white p-4 ${warning ? "border-amber-200" : "border-[#E3DED3]"}`}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">{label}</p>
        <span className={`rounded-xl p-2 ${warning ? "bg-amber-50 text-amber-600" : "bg-[#E6F3EE] text-[#00704A]"}`}><Icon size={15} /></span>
      </div>
      <p className={`mt-2 text-2xl font-black ${warning ? "text-amber-600" : "text-[#06251B]"}`}>{fmtMetric(value, unit)}</p>
      <p className="mt-1 text-[11px] text-gray-400">{detail}</p>
    </article>
  );
}

export default function IosPerformance() {
  const [month, setMonth] = useState(currentMonth);
  const [data, setData] = useState(null);
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showScenario, setShowScenario] = useState(false);
  const [form, setForm] = useState({
    name: "Cenário base",
    description: "",
    ...horizon(),
    assumptions: [],
  });

  async function load(selectedMonth = month) {
    setLoading(true);
    setError("");
    try {
      const [performanceResponse, scenariosResponse] = await Promise.all([
        iosApi.performance(selectedMonth),
        iosApi.scenarios(),
      ]);
      setData(performanceResponse.data);
      setScenarios(scenariosResponse.data);
    } catch (requestError) {
      setError(iosError(requestError, "Não foi possível carregar Crescimento e Financeiro."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(month); }, [month]);

  function openScenario() {
    setForm({
      name: "Cenário base",
      description: "",
      ...horizon(),
      assumptions: assumptionsFrom(data),
    });
    setShowScenario(true);
  }

  async function syncMetrics() {
    setBusy(true);
    try {
      const response = await iosApi.syncPerformance(month);
      toast.success(`${response.data.synced.length} métricas oficiais sincronizadas.`);
    } catch (requestError) {
      toast.error(iosError(requestError, "Não foi possível sincronizar as métricas."));
    } finally {
      setBusy(false);
    }
  }

  async function createScenario(event) {
    event.preventDefault();
    setBusy(true);
    try {
      await iosApi.createScenario(form);
      toast.success("Cenário criado com premissas versionáveis.");
      setShowScenario(false);
      await load();
    } catch (requestError) {
      toast.error(iosError(requestError, "Não foi possível criar o cenário."));
    } finally {
      setBusy(false);
    }
  }

  async function scenarioAction(action, id, success) {
    setBusy(true);
    try {
      await action(id);
      toast.success(success);
      await load();
    } catch (requestError) {
      toast.error(iosError(requestError));
    } finally {
      setBusy(false);
    }
  }

  const latestProjection = useMemo(() => {
    const run = scenarios.flatMap((scenario) =>
      (scenario.runs || []).map((item) => ({ ...item, scenario }))
    ).sort((a, b) => new Date(b.executedAt) - new Date(a.executedAt))[0];
    return run;
  }, [scenarios]);

  if (loading) {
    return <IosLayout title="Crescimento & Financeiro" subtitle="Indicadores oficiais, caixa e cenários com premissas explícitas."><IosLoading /></IosLayout>;
  }
  if (error) {
    return <IosLayout title="Crescimento & Financeiro" subtitle="Indicadores oficiais, caixa e cenários com premissas explícitas."><IosError message={error} onRetry={() => load()} /></IosLayout>;
  }

  const growth = data.growth;
  const finance = data.finance;

  return (
    <IosLayout
      title="Crescimento & Financeiro"
      subtitle="Realizado, contratado e projetado permanecem separados."
      actions={(
        <>
          <IosButton variant="secondary" onClick={syncMetrics} disabled={busy}><RefreshCw size={14} /> Sincronizar métricas</IosButton>
          <IosButton onClick={openScenario}><Plus size={14} /> Novo cenário</IosButton>
        </>
      )}
    >
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3 rounded-2xl border border-[#E3DED3] bg-white p-4">
        <IosField label="Período de análise">
          <input type="month" className={`${inputClass} w-48`} value={month} onChange={(event) => setMonth(event.target.value)} />
        </IosField>
        <p className="max-w-xl text-xs leading-relaxed text-gray-400">MRR é contratado e normalizado. Receita e custos são realizados conforme lançamentos aprovados.</p>
      </div>

      <section className="mb-6">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-black text-[#00704A]"><TrendingUp size={16} /> Crescimento</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="MRR normalizado" value={growth.mrr} unit="BRL" detail="contratos ativos ao fim do período" icon={CircleDollarSign} />
          <MetricCard label="ARR normalizado" value={growth.arr} unit="BRL" detail="MRR × 12" icon={LineChart} />
          <MetricCard label="Clínicas ativas" value={growth.activeClinics} unit="NUMBER" detail={`+${growth.newClinics} novas · ${growth.cancellations} canceladas`} icon={Building2} />
          <MetricCard label="Logo churn" value={growth.logoChurn} unit="PERCENTAGE" detail={growth.retention == null ? "base inicial insuficiente" : `${fmtMetric(growth.retention, "PERCENTAGE")} de retenção`} icon={TrendingDown} warning={(growth.logoChurn ?? 0) > 5} />
        </div>
      </section>

      <section className="mb-6">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-black text-[#00704A]"><Gauge size={16} /> Unit economics</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Crescimento de MRR" value={growth.growthRate} unit="PERCENTAGE" detail={growth.growthRate == null ? "sem base do mês anterior" : "vs. base do mês anterior"} icon={Percent} warning={growth.growthRate != null && growth.growthRate < 0} />
          <MetricCard label="CAC" value={growth.cac} unit="BRL" detail={growth.cac == null ? "classifique despesas como aquisição" : `${growth.newClinics} novas no período`} icon={Coins} />
          <MetricCard label="LTV" value={growth.ltv} unit="BRL" detail={growth.ltv == null ? "requer margem e churn do período" : `ARPA ${fmtMetric(growth.arpa, "BRL")} · margem aplicada`} icon={CircleDollarSign} />
          <MetricCard label="LTV / CAC" value={growth.ltvCac} unit="RATIO" detail={growth.ltvCac == null ? "requer CAC e LTV definidos" : "referência saudável ≥ 3×"} icon={Gauge} warning={growth.ltvCac != null && growth.ltvCac < 3} />
        </div>
        <p className="mt-2 text-xs leading-relaxed text-gray-400">CAC e LTV usam classificação e lançamentos manuais do financeiro. Sem novas clínicas, custos de aquisição ou churn no período, a métrica fica sem medição em vez de exibir um número não confiável.</p>
      </section>

      <section className="mb-6">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-black text-[#00704A]"><Banknote size={16} /> Financeiro</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Receitas" value={finance.revenue} unit="BRL" detail="lançamentos aprovados no período" icon={TrendingUp} />
          <MetricCard label="Custos" value={finance.costs} unit="BRL" detail="despesas aprovadas no período" icon={WalletCards} />
          <MetricCard label="Resultado" value={finance.result} unit="BRL" detail={`${fmtMetric(finance.margin, "PERCENTAGE")} de margem`} icon={ShieldCheck} warning={finance.result < 0} />
          <MetricCard label="Runway registrado" value={finance.runway} unit="MONTHS" detail={finance.burnRate ? `${fmtMetric(finance.burnRate, "BRL")} de burn` : "sem burn líquido no período"} icon={Flame} warning={finance.runway != null && finance.runway < 6} />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        <section className="rounded-3xl border border-[#E3DED3] bg-white">
          <div className="border-b border-[#EEEAE1] px-5 py-4">
            <h2 className="flex items-center gap-2 text-sm font-black text-[#00704A]"><Calculator size={16} /> Cenários e projeções</h2>
            <p className="mt-1 text-xs text-gray-400">Publicações são imutáveis; alterações geram nova versão.</p>
          </div>
          <div className="space-y-3 p-4">
            {scenarios.length === 0 ? (
              <IosEmpty title="Nenhum cenário criado" description="Crie um cenário e informe as premissas que sustentam a projeção." action={<IosButton onClick={openScenario}><Plus size={14} /> Criar cenário</IosButton>} />
            ) : scenarios.map((scenario) => (
              <article key={scenario.id} className="rounded-2xl border border-[#EEEAE1] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black text-gray-800">{scenario.name} <span className="text-xs text-gray-400">v{scenario.version}</span></p>
                    <p className="mt-1 text-xs text-gray-400">{scenario.description || "Sem descrição"} · {scenario.assumptions.length} premissas</p>
                  </div>
                  <IosBadge status={scenario.status} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {scenario.status === "DRAFT" && (
                    <>
                      <IosButton variant="secondary" disabled={busy} onClick={() => scenarioAction(iosApi.runScenario, scenario.id, "Projeção executada.")}><Rocket size={13} /> Executar</IosButton>
                      {!!scenario.runs.length && <IosButton disabled={busy} onClick={() => scenarioAction(iosApi.publishScenario, scenario.id, "Cenário publicado.")}>Publicar</IosButton>}
                    </>
                  )}
                  {scenario.status === "PUBLISHED" && <IosButton variant="secondary" disabled={busy} onClick={() => scenarioAction(iosApi.versionScenario, scenario.id, "Nova versão criada.")}>Criar versão</IosButton>}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-[#E3DED3] bg-white">
          <div className="border-b border-[#EEEAE1] px-5 py-4">
            <h2 className="text-sm font-black text-[#00704A]">Última projeção</h2>
            <p className="mt-1 text-xs text-gray-400">{latestProjection ? `${latestProjection.scenario.name} v${latestProjection.scenario.version}` : "Execute um cenário para visualizar a curva."}</p>
          </div>
          {!latestProjection ? (
            <div className="p-4"><IosEmpty title="Sem projeção executada" /></div>
          ) : (
            <div className="p-5">
              <div className="mb-5 grid grid-cols-3 gap-3">
                <div><p className="text-[10px] uppercase text-gray-400">MRR final</p><p className="font-black text-[#00704A]">{fmtMetric(latestProjection.outputs.endingMrr, "BRL")}</p></div>
                <div><p className="text-[10px] uppercase text-gray-400">Caixa final</p><p className="font-black text-[#00704A]">{fmtMetric(latestProjection.outputs.endingCash, "BRL")}</p></div>
                <div><p className="text-[10px] uppercase text-gray-400">Break-even</p><p className="font-black text-[#00704A]">{fmtMetric(latestProjection.outputs.breakEvenMrr, "BRL")}</p></div>
              </div>
              <div className="space-y-2">
                {latestProjection.outputs.points.map((point) => {
                  const max = Math.max(...latestProjection.outputs.points.map((item) => item.revenue), 1);
                  return (
                    <div key={point.period} className="grid grid-cols-[62px_1fr_100px] items-center gap-3 text-xs">
                      <span className="text-gray-400">{point.period}</span>
                      <div className="h-2 overflow-hidden rounded-full bg-[#EEEAE1]"><div className="h-full rounded-full bg-[#00704A]" style={{ width: `${Math.max((point.revenue / max) * 100, 2)}%` }} /></div>
                      <span className="text-right font-bold text-gray-600">{fmtMetric(point.revenue, "BRL")}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </div>

      <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-xs font-black uppercase tracking-wide text-amber-700">Limites conhecidos</p>
        <ul className="mt-2 space-y-1 text-xs text-amber-800/80">
          {data.caveats.map((item) => <li key={item}>• {item}</li>)}
        </ul>
      </div>

      <IosModal open={showScenario} title="Novo cenário" subtitle="Cada número deve ter uma justificativa ou fonte." onClose={() => setShowScenario(false)} width="max-w-3xl">
        <form onSubmit={createScenario} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <IosField label="Nome"><input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></IosField>
            <IosField label="Descrição"><input className={inputClass} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></IosField>
            <IosField label="Início"><input type="date" className={inputClass} value={form.horizonStart} onChange={(e) => setForm({ ...form, horizonStart: e.target.value })} required /></IosField>
            <IosField label="Fim"><input type="date" className={inputClass} value={form.horizonEnd} onChange={(e) => setForm({ ...form, horizonEnd: e.target.value })} required /></IosField>
          </div>
          <div>
            <p className="mb-3 text-xs font-black uppercase tracking-wide text-gray-500">Premissas</p>
            <div className="grid gap-3 md:grid-cols-2">
              {form.assumptions.map((assumption, index) => (
                <div key={assumption.key} className="rounded-2xl border border-[#E3DED3] bg-white p-3">
                  <IosField label={assumption.label} hint={assumption.unit === "PERCENTAGE" ? "Percentual mensal" : assumption.sourceRef}>
                    <input type="number" step="0.01" className={inputClass} value={assumption.value} onChange={(e) => {
                      const assumptions = [...form.assumptions];
                      assumptions[index] = { ...assumption, value: e.target.value };
                      setForm({ ...form, assumptions });
                    }} required />
                  </IosField>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2"><IosButton variant="ghost" onClick={() => setShowScenario(false)}>Cancelar</IosButton><IosButton type="submit" disabled={busy}>Criar cenário</IosButton></div>
        </form>
      </IosModal>
    </IosLayout>
  );
}
