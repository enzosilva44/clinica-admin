import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  BriefcaseBusiness,
  CircleDollarSign,
  Plus,
  UserRoundCheck,
  Users,
  UserSearch,
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
import { fmtDate, fmtMetric } from "../iosFormat";

const EMPTY = {
  title: "",
  area: "",
  type: "CURRENT",
  status: "OPEN",
  occupantUserId: "",
  capacityPercent: 100,
  monthlyCost: "",
  targetDate: "",
  notes: "",
};

function clean(data) {
  return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== ""));
}

function Summary({ label, value, unit = "NUMBER", icon: Icon }) {
  return (
    <div className="rounded-2xl border border-[#E3DED3] bg-white p-4">
      <div className="flex items-center justify-between text-gray-400"><p className="text-[10px] font-black uppercase tracking-wide">{label}</p><Icon size={15} /></div>
      <p className="mt-2 text-2xl font-black text-[#00704A]">{fmtMetric(value, unit)}</p>
    </div>
  );
}

export default function IosPeople() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      setData((await iosApi.people()).data);
    } catch (requestError) {
      setError(iosError(requestError, "Não foi possível carregar Pessoas."));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  async function createPosition(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await iosApi.createPosition(clean({
        ...form,
        capacityPercent: Number(form.capacityPercent),
      }));
      toast.success("Posição adicionada ao planejamento.");
      setShowForm(false);
      setForm(EMPTY);
      await load();
    } catch (requestError) {
      toast.error(iosError(requestError));
    } finally {
      setSaving(false);
    }
  }

  async function updatePosition(id, patch) {
    try {
      await iosApi.updatePosition(id, patch);
      await load();
    } catch (requestError) {
      toast.error(iosError(requestError));
    }
  }

  if (loading) return <IosLayout title="Pessoas" subtitle="Estrutura, capacidade, custos e contratações."><IosLoading /></IosLayout>;
  if (error) return <IosLayout title="Pessoas" subtitle="Estrutura, capacidade, custos e contratações."><IosError message={error} onRetry={load} /></IosLayout>;

  return (
    <IosLayout
      title="Pessoas"
      subtitle="Quem ocupa cada responsabilidade hoje e qual capacidade será necessária amanhã."
      actions={<IosButton onClick={() => setShowForm(true)}><Plus size={14} /> Nova posição</IosButton>}
    >
      <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-6">
        <Summary label="Equipe admin" value={data.summary.teamMembers} icon={Users} />
        <Summary label="Posições atuais" value={data.summary.currentPositions} icon={UserRoundCheck} />
        <Summary label="Planejadas" value={data.summary.plannedPositions} icon={BriefcaseBusiness} />
        <Summary label="Em aberto" value={data.summary.openPositions} icon={UserSearch} />
        <Summary label="Custo atual" value={data.summary.monthlyCost} unit="BRL" icon={CircleDollarSign} />
        <Summary label="Custo planejado" value={data.summary.plannedMonthlyCost} unit="BRL" icon={CircleDollarSign} />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <section className="rounded-3xl border border-[#E3DED3] bg-white">
          <div className="border-b border-[#EEEAE1] px-5 py-4">
            <h2 className="text-sm font-black text-[#00704A]">Estrutura e plano de contratação</h2>
            <p className="mt-1 text-xs text-gray-400">Posições atuais e futuras com capacidade e custo mensal explícitos.</p>
          </div>
          <div className="space-y-3 p-4">
            {!data.positions.length ? (
              <IosEmpty title="Nenhuma posição cadastrada" description="Comece registrando as responsabilidades atuais, mesmo quando uma pessoa acumula mais de uma função." action={<IosButton onClick={() => setShowForm(true)}><Plus size={13} /> Criar posição</IosButton>} />
            ) : data.positions.map((position) => (
              <article key={position.id} className="rounded-2xl border border-[#E9E5DC] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2"><p className="font-black text-gray-800">{position.title}</p><IosBadge status={position.type} /><IosBadge status={position.status} /></div>
                    <p className="mt-1 text-xs text-gray-400">{position.area} · {position.occupant?.name || "Sem ocupante"} · {position.capacityPercent}% de capacidade</p>
                  </div>
                  <p className="text-sm font-black text-[#00704A]">{fmtMetric(position.monthlyCost, "BRL")}</p>
                </div>
                {position.notes && <p className="mt-3 text-xs leading-relaxed text-gray-500">{position.notes}</p>}
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <select className={`${inputClass} py-1.5 text-xs`} value={position.status} onChange={(e) => updatePosition(position.id, { status: e.target.value })}>
                    <option value="OPEN">Aberta</option><option value="FILLED">Preenchida</option><option value="ON_HOLD">Em espera</option><option value="CLOSED">Encerrada</option>
                  </select>
                  <select className={`${inputClass} py-1.5 text-xs`} value={position.occupantUserId || ""} onChange={(e) => updatePosition(position.id, { occupantUserId: e.target.value || null, status: e.target.value ? "FILLED" : "OPEN" })}>
                    <option value="">Sem ocupante</option>{data.team.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
                  </select>
                </div>
              </article>
            ))}
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-3xl border border-[#E3DED3] bg-white">
            <div className="border-b border-[#EEEAE1] px-5 py-4"><h2 className="text-sm font-black text-[#00704A]">Capacidade por área</h2></div>
            <div className="space-y-3 p-4">
              {!Object.keys(data.areas).length ? <IosEmpty title="Sem áreas mapeadas" /> : Object.entries(data.areas).map(([area, summary]) => (
                <div key={area} className="rounded-2xl bg-[#F7F5F0] p-3">
                  <div className="flex items-center justify-between"><p className="text-sm font-bold text-gray-700">{area}</p><span className="text-xs font-black text-[#00704A]">{summary.capacity}%</span></div>
                  <p className="mt-1 text-[11px] text-gray-400">{summary.filled} preenchidas · {summary.open} abertas · {summary.positions} posições</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-[#E3DED3] bg-white">
            <div className="border-b border-[#EEEAE1] px-5 py-4"><h2 className="text-sm font-black text-[#00704A]">Equipe cadastrada</h2></div>
            <div className="space-y-2 p-4">{data.team.map((person) => (
              <div key={person.id} className="rounded-xl border border-[#EEEAE1] px-3 py-2.5">
                <p className="text-sm font-bold text-gray-700">{person.name}</p>
                <p className="text-[10px] text-gray-400">{person.email} · último acesso {fmtDate(person.lastLoginAt)}</p>
              </div>
            ))}</div>
          </section>
        </div>
      </div>

      <IosModal open={showForm} title="Nova posição" subtitle="Pode representar uma função atual ou uma contratação planejada." onClose={() => setShowForm(false)} width="max-w-2xl">
        <form onSubmit={createPosition} className="grid gap-4 md:grid-cols-2">
          <IosField label="Cargo ou responsabilidade"><input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></IosField>
          <IosField label="Área"><input className={inputClass} value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} placeholder="Produto, Comercial, Operações…" required /></IosField>
          <IosField label="Tipo"><select className={inputClass} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option value="CURRENT">Atual</option><option value="PLANNED">Planejada</option></select></IosField>
          <IosField label="Estado"><select className={inputClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="OPEN">Aberta</option><option value="FILLED">Preenchida</option><option value="ON_HOLD">Em espera</option></select></IosField>
          <IosField label="Ocupante"><select className={inputClass} value={form.occupantUserId} onChange={(e) => setForm({ ...form, occupantUserId: e.target.value, status: e.target.value ? "FILLED" : form.status })}><option value="">Sem ocupante</option>{data.team.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select></IosField>
          <IosField label="Capacidade alocada (%)"><input type="number" min="0" max="300" className={inputClass} value={form.capacityPercent} onChange={(e) => setForm({ ...form, capacityPercent: e.target.value })} required /></IosField>
          <IosField label="Custo mensal"><input type="number" min="0" step="0.01" className={inputClass} value={form.monthlyCost} onChange={(e) => setForm({ ...form, monthlyCost: e.target.value })} /></IosField>
          <IosField label="Data-alvo"><input type="date" className={inputClass} value={form.targetDate} onChange={(e) => setForm({ ...form, targetDate: e.target.value })} /></IosField>
          <div className="md:col-span-2"><IosField label="Notas"><textarea className={`${inputClass} min-h-24`} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></IosField></div>
          <div className="flex justify-end gap-2 md:col-span-2"><IosButton variant="ghost" onClick={() => setShowForm(false)}>Cancelar</IosButton><IosButton type="submit" disabled={saving}>Salvar posição</IosButton></div>
        </form>
      </IosModal>
    </IosLayout>
  );
}
