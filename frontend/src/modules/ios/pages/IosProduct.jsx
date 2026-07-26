import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  BarChart3,
  CheckSquare,
  GitBranch,
  PackageCheck,
  Plus,
  Rocket,
  Unlink,
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
import { fmtDate, fmtMetric, inputDate } from "../iosFormat";

function monthRange() {
  const now = new Date();
  return {
    periodStart: inputDate(new Date(now.getFullYear(), now.getMonth(), 1)),
    periodEnd: inputDate(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  };
}

function Summary({ label, value, icon: Icon }) {
  return <div className="rounded-2xl border border-[#E3DED3] bg-white p-4"><div className="flex justify-between text-gray-400"><p className="text-[10px] font-black uppercase tracking-wide">{label}</p><Icon size={15} /></div><p className="mt-2 text-2xl font-black text-[#00704A]">{value}</p></div>;
}

export default function IosProduct() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showRelease, setShowRelease] = useState(false);
  const [showAdoption, setShowAdoption] = useState(false);
  const [releaseForm, setReleaseForm] = useState({ name: "", version: "", description: "", plannedAt: "" });
  const [adoptionForm, setAdoptionForm] = useState({
    featureKey: "", featureName: "", eligibleUsers: "", activeUsers: "", usageCount: "", sourceRef: "", notes: "", ...monthRange(),
  });
  const [taskSelection, setTaskSelection] = useState({});

  async function load() {
    setLoading(true);
    setError("");
    try {
      setData((await iosApi.product()).data);
    } catch (requestError) {
      setError(iosError(requestError, "Não foi possível carregar Produto."));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  async function createRelease(event) {
    event.preventDefault();
    setBusy(true);
    try {
      await iosApi.createRelease(Object.fromEntries(Object.entries(releaseForm).filter(([, value]) => value !== "")));
      toast.success("Release adicionada ao roadmap.");
      setShowRelease(false);
      setReleaseForm({ name: "", version: "", description: "", plannedAt: "" });
      await load();
    } catch (requestError) {
      toast.error(iosError(requestError));
    } finally { setBusy(false); }
  }

  async function createAdoption(event) {
    event.preventDefault();
    setBusy(true);
    try {
      await iosApi.createAdoption({
        ...adoptionForm,
        eligibleUsers: Number(adoptionForm.eligibleUsers),
        activeUsers: Number(adoptionForm.activeUsers),
        usageCount: Number(adoptionForm.usageCount || 0),
      });
      toast.success("Snapshot de adoção registrado.");
      setShowAdoption(false);
      setAdoptionForm({ featureKey: "", featureName: "", eligibleUsers: "", activeUsers: "", usageCount: "", sourceRef: "", notes: "", ...monthRange() });
      await load();
    } catch (requestError) {
      toast.error(iosError(requestError));
    } finally { setBusy(false); }
  }

  async function updateRelease(id, patch) {
    try {
      await iosApi.updateRelease(id, patch);
      await load();
    } catch (requestError) { toast.error(iosError(requestError)); }
  }

  async function linkTask(releaseId) {
    const taskId = taskSelection[releaseId];
    if (!taskId) return;
    try {
      await iosApi.linkReleaseTask(releaseId, taskId);
      setTaskSelection({ ...taskSelection, [releaseId]: "" });
      await load();
    } catch (requestError) { toast.error(iosError(requestError)); }
  }

  async function unlinkTask(releaseId, taskId) {
    try {
      await iosApi.unlinkReleaseTask(releaseId, taskId);
      await load();
    } catch (requestError) { toast.error(iosError(requestError)); }
  }

  const latestAdoption = useMemo(() => {
    const seen = new Set();
    return (data?.adoption || []).filter((item) => {
      if (seen.has(item.featureKey)) return false;
      seen.add(item.featureKey);
      return true;
    });
  }, [data]);

  if (loading) return <IosLayout title="Produto" subtitle="Roadmap, releases, entregas e adoção."><IosLoading /></IosLayout>;
  if (error) return <IosLayout title="Produto" subtitle="Roadmap, releases, entregas e adoção."><IosError message={error} onRetry={load} /></IosLayout>;

  return (
    <IosLayout
      title="Produto"
      subtitle="O roadmap reaproveita Tasks; releases organizam entregas e adoção mede resultado."
      actions={<><IosButton variant="secondary" onClick={() => setShowAdoption(true)}><BarChart3 size={14} /> Registrar adoção</IosButton><IosButton onClick={() => setShowRelease(true)}><Plus size={14} /> Nova release</IosButton></>}
    >
      <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Summary label="Tasks" value={data.summary.tasks} icon={CheckSquare} />
        <Summary label="Concluídas" value={data.summary.completed} icon={PackageCheck} />
        <Summary label="Releases ativas" value={data.summary.activeReleases} icon={Rocket} />
        <Summary label="Publicadas" value={data.summary.released} icon={GitBranch} />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <section className="rounded-3xl border border-[#E3DED3] bg-white">
          <div className="flex items-center justify-between border-b border-[#EEEAE1] px-5 py-4">
            <div><h2 className="text-sm font-black text-[#00704A]">Roadmap de releases</h2><p className="mt-1 text-xs text-gray-400">Tasks continuam sendo executadas no módulo operacional.</p></div>
            <Link to="/tasks"><IosButton variant="secondary"><CheckSquare size={13} /> Abrir Tasks</IosButton></Link>
          </div>
          <div className="space-y-4 p-4">
            {!data.releases.length ? <IosEmpty title="Nenhuma release planejada" description="Agrupe Tasks em uma entrega com data e estado claros." action={<IosButton onClick={() => setShowRelease(true)}><Plus size={13} /> Criar release</IosButton>} /> : data.releases.map((release) => {
              const linkedIds = new Set(release.taskLinks.map((link) => link.taskId));
              const available = data.tasks.filter((task) => !linkedIds.has(task.id));
              return (
                <article key={release.id} className="rounded-2xl border border-[#E9E5DC] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div><div className="flex items-center gap-2"><p className="font-black text-gray-800">{release.name}</p>{release.version && <span className="rounded-full bg-[#F2F0EB] px-2 py-0.5 text-[10px] font-bold text-gray-500">{release.version}</span>}</div><p className="mt-1 text-xs text-gray-400">{release.description || "Sem descrição"} · planejada {fmtDate(release.plannedAt)}</p></div>
                    <select className={`${inputClass} w-40 py-1.5 text-xs`} value={release.status} onChange={(e) => updateRelease(release.id, { status: e.target.value })}><option value="PLANNED">Planejada</option><option value="IN_PROGRESS">Em andamento</option><option value="RELEASED">Publicada</option><option value="CANCELED">Cancelada</option></select>
                  </div>
                  <div className="mt-4 space-y-2">
                    {release.taskLinks.map((link) => (
                      <div key={link.taskId} className="flex items-center justify-between rounded-xl bg-[#F7F5F0] px-3 py-2 text-xs">
                        <span><strong className="text-[#00704A]">#{link.task.number}</strong> {link.task.title}</span>
                        <button onClick={() => unlinkTask(release.id, link.taskId)} className="text-gray-300 hover:text-red-500"><Unlink size={13} /></button>
                      </div>
                    ))}
                    {available.length > 0 && (
                      <div className="flex gap-2">
                        <select className={`${inputClass} py-1.5 text-xs`} value={taskSelection[release.id] || ""} onChange={(e) => setTaskSelection({ ...taskSelection, [release.id]: e.target.value })}><option value="">Vincular Task…</option>{available.map((task) => <option key={task.id} value={task.id}>#{task.number} {task.title}</option>)}</select>
                        <IosButton variant="secondary" onClick={() => linkTask(release.id)} disabled={!taskSelection[release.id]}>Vincular</IosButton>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-3xl border border-[#E3DED3] bg-white">
            <div className="border-b border-[#EEEAE1] px-5 py-4"><h2 className="text-sm font-black text-[#00704A]">Adoção por funcionalidade</h2><p className="mt-1 text-xs text-gray-400">Último snapshot de cada recurso.</p></div>
            <div className="space-y-4 p-4">
              {!latestAdoption.length ? <IosEmpty title="Sem dados de adoção" /> : latestAdoption.map((item) => (
                <article key={item.id}>
                  <div className="mb-2 flex justify-between"><div><p className="text-sm font-bold text-gray-700">{item.featureName}</p><p className="text-[10px] text-gray-400">{item.activeUsers}/{item.eligibleUsers} ativos · {item.usageCount} usos</p></div><span className="text-sm font-black text-[#00704A]">{fmtMetric(item.adoptionRate, "PERCENTAGE")}</span></div>
                  <IosProgress value={item.adoptionRate} />
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-[#E3DED3] bg-white">
            <div className="border-b border-[#EEEAE1] px-5 py-4"><h2 className="text-sm font-black text-[#00704A]">Backlog por área</h2></div>
            <div className="space-y-2 p-4">{Object.entries(data.byArea).sort((a, b) => b[1] - a[1]).map(([area, count]) => <div key={area} className="flex justify-between rounded-xl bg-[#F7F5F0] px-3 py-2 text-xs"><span className="font-semibold text-gray-600">{area}</span><span className="font-black text-[#00704A]">{count}</span></div>)}</div>
          </section>
        </div>
      </div>

      <IosModal open={showRelease} title="Nova release" subtitle="Planeje a entrega; vincule Tasks depois." onClose={() => setShowRelease(false)}>
        <form onSubmit={createRelease} className="space-y-4">
          <IosField label="Nome"><input className={inputClass} value={releaseForm.name} onChange={(e) => setReleaseForm({ ...releaseForm, name: e.target.value })} required /></IosField>
          <div className="grid grid-cols-2 gap-3"><IosField label="Versão"><input className={inputClass} value={releaseForm.version} onChange={(e) => setReleaseForm({ ...releaseForm, version: e.target.value })} placeholder="v1.2" /></IosField><IosField label="Data planejada"><input type="date" className={inputClass} value={releaseForm.plannedAt} onChange={(e) => setReleaseForm({ ...releaseForm, plannedAt: e.target.value })} /></IosField></div>
          <IosField label="Descrição"><textarea className={`${inputClass} min-h-24`} value={releaseForm.description} onChange={(e) => setReleaseForm({ ...releaseForm, description: e.target.value })} /></IosField>
          <div className="flex justify-end gap-2"><IosButton variant="ghost" onClick={() => setShowRelease(false)}>Cancelar</IosButton><IosButton type="submit" disabled={busy}>Criar release</IosButton></div>
        </form>
      </IosModal>

      <IosModal open={showAdoption} title="Registrar adoção" subtitle="Informe período e fonte verificável." onClose={() => setShowAdoption(false)}>
        <form onSubmit={createAdoption} className="grid gap-4 md:grid-cols-2">
          <IosField label="Chave"><input className={inputClass} value={adoptionForm.featureKey} onChange={(e) => setAdoptionForm({ ...adoptionForm, featureKey: e.target.value.toLowerCase().replace(/\s+/g, "_") })} placeholder="billing" required /></IosField>
          <IosField label="Funcionalidade"><input className={inputClass} value={adoptionForm.featureName} onChange={(e) => setAdoptionForm({ ...adoptionForm, featureName: e.target.value })} required /></IosField>
          <IosField label="Início"><input type="date" className={inputClass} value={adoptionForm.periodStart} onChange={(e) => setAdoptionForm({ ...adoptionForm, periodStart: e.target.value })} required /></IosField>
          <IosField label="Fim"><input type="date" className={inputClass} value={adoptionForm.periodEnd} onChange={(e) => setAdoptionForm({ ...adoptionForm, periodEnd: e.target.value })} required /></IosField>
          <IosField label="Usuários elegíveis"><input type="number" min="0" className={inputClass} value={adoptionForm.eligibleUsers} onChange={(e) => setAdoptionForm({ ...adoptionForm, eligibleUsers: e.target.value })} required /></IosField>
          <IosField label="Usuários ativos"><input type="number" min="0" className={inputClass} value={adoptionForm.activeUsers} onChange={(e) => setAdoptionForm({ ...adoptionForm, activeUsers: e.target.value })} required /></IosField>
          <IosField label="Quantidade de usos"><input type="number" min="0" className={inputClass} value={adoptionForm.usageCount} onChange={(e) => setAdoptionForm({ ...adoptionForm, usageCount: e.target.value })} /></IosField>
          <IosField label="Fonte"><input className={inputClass} value={adoptionForm.sourceRef} onChange={(e) => setAdoptionForm({ ...adoptionForm, sourceRef: e.target.value })} required /></IosField>
          <div className="md:col-span-2"><IosField label="Notas"><textarea className={`${inputClass} min-h-20`} value={adoptionForm.notes} onChange={(e) => setAdoptionForm({ ...adoptionForm, notes: e.target.value })} /></IosField></div>
          <div className="flex justify-end gap-2 md:col-span-2"><IosButton variant="ghost" onClick={() => setShowAdoption(false)}>Cancelar</IosButton><IosButton type="submit" disabled={busy}>Registrar</IosButton></div>
        </form>
      </IosModal>
    </IosLayout>
  );
}
