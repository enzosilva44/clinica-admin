import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  BadgeDollarSign,
  Handshake,
  Megaphone,
  Plus,
  RadioTower,
  RefreshCw,
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
  inputClass,
} from "../components/IosUi";
import { iosApi, iosError } from "../iosApi";
import { fmtDate, fmtMetric } from "../iosFormat";

const CONFIG = {
  channel: { title: "Novo canal", icon: RadioTower },
  campaign: { title: "Nova campanha", icon: Megaphone },
  partner: { title: "Novo parceiro", icon: Handshake },
  commission: { title: "Nova comissão", icon: BadgeDollarSign },
};

const EMPTY = {
  channel: { name: "", category: "", monthlyBudget: "", notes: "" },
  campaign: { name: "", channelId: "", objective: "", startDate: "", endDate: "", budget: "", notes: "" },
  partner: { name: "", contactName: "", contactEmail: "", commissionType: "", commissionValue: "", notes: "" },
  commission: { description: "", partnerId: "", leadId: "", amount: "", dueDate: "", notes: "" },
};

function withoutEmpty(data) {
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

export default function IosCommercial() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mode, setMode] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      setData((await iosApi.commercial()).data);
    } catch (requestError) {
      setError(iosError(requestError, "Não foi possível carregar a inteligência comercial."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function open(type) {
    setMode(type);
    setForm({ ...EMPTY[type] });
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const methods = {
        channel: iosApi.createChannel,
        campaign: iosApi.createCampaign,
        partner: iosApi.createPartner,
        commission: iosApi.createCommission,
      };
      await methods[mode](withoutEmpty(form));
      toast.success(`${CONFIG[mode].title.replace("Novo", "").replace("Nova", "").trim()} registrado.`);
      setMode(null);
      await load();
    } catch (requestError) {
      toast.error(iosError(requestError));
    } finally {
      setSaving(false);
    }
  }

  async function update(method, id, patch) {
    try {
      await method(id, patch);
      await load();
    } catch (requestError) {
      toast.error(iosError(requestError));
    }
  }

  if (loading) return <IosLayout title="Comercial" subtitle="Funil, canais, campanhas, parceiros e comissões."><IosLoading /></IosLayout>;
  if (error) return <IosLayout title="Comercial" subtitle="Funil, canais, campanhas, parceiros e comissões."><IosError message={error} onRetry={load} /></IosLayout>;

  return (
    <IosLayout
      title="Comercial"
      subtitle="Histórico do funil e investimentos conectados às oportunidades reais."
      actions={<Link to="/comercial"><IosButton variant="secondary"><Users size={14} /> Abrir pipeline operacional</IosButton></Link>}
    >
      <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Summary label="Leads" value={data.pipeline.total} icon={Users} />
        <Summary label="Pipeline" value={data.pipeline.activeValue} unit="BRL" icon={RadioTower} />
        <Summary label="Conversão" value={data.pipeline.conversionRate} unit="PERCENTAGE" icon={Megaphone} />
        <Summary label="MRR ganho" value={data.pipeline.wonValue} unit="BRL" icon={BadgeDollarSign} />
        <Summary label="Comissões pendentes" value={data.commissionsSummary.pending} unit="BRL" icon={Handshake} />
      </section>

      <div className="mb-6 grid gap-6 xl:grid-cols-[1fr_1.25fr]">
        <section className="rounded-3xl border border-[#E3DED3] bg-white">
          <div className="flex items-center justify-between border-b border-[#EEEAE1] px-5 py-4">
            <div><h2 className="text-sm font-black text-[#00704A]">Canais</h2><p className="mt-1 text-xs text-gray-400">Origem planejada e orçamento mensal.</p></div>
            <IosButton variant="secondary" onClick={() => open("channel")}><Plus size={13} /> Canal</IosButton>
          </div>
          <div className="p-4">
            {!data.channels.length ? <IosEmpty title="Nenhum canal cadastrado" /> : (
              <div className="space-y-2">
                {data.channels.map((channel) => (
                  <div key={channel.id} className="flex items-center justify-between rounded-2xl border border-[#EEEAE1] p-3">
                    <div><p className="text-sm font-bold text-gray-700">{channel.name}</p><p className="text-[11px] text-gray-400">{channel.category || "Sem categoria"} · {fmtMetric(channel.monthlyBudget, "BRL")}</p></div>
                    <select className={`${inputClass} w-32 py-1.5 text-xs`} value={channel.status} onChange={(e) => update(iosApi.updateChannel, channel.id, { status: e.target.value })}>
                      <option value="ACTIVE">Ativo</option><option value="PAUSED">Pausado</option><option value="ARCHIVED">Arquivado</option>
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-[#E3DED3] bg-white">
          <div className="flex items-center justify-between border-b border-[#EEEAE1] px-5 py-4">
            <div><h2 className="text-sm font-black text-[#00704A]">Desempenho por origem</h2><p className="mt-1 text-xs text-gray-400">Dados derivados dos leads existentes.</p></div>
            <IosButton variant="ghost" onClick={load}><RefreshCw size={14} /></IosButton>
          </div>
          <div className="overflow-x-auto p-4">
            {!data.sources.length ? <IosEmpty title="Sem fontes nos leads" /> : (
              <table className="w-full text-left text-xs">
                <thead className="text-[10px] uppercase text-gray-400"><tr><th className="pb-2">Origem</th><th>Leads</th><th>Ganhos</th><th>Conversão</th><th className="text-right">Valor</th></tr></thead>
                <tbody>{data.sources.map((source) => (
                  <tr key={source.source} className="border-t border-[#F0EDE6]">
                    <td className="py-2.5 font-bold text-gray-700">{source.source}</td><td>{source.leads}</td><td>{source.won}</td><td>{fmtMetric(source.conversionRate, "PERCENTAGE")}</td><td className="text-right font-semibold">{fmtMetric(source.value, "BRL")}</td>
                  </tr>
                ))}</tbody>
              </table>
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="rounded-3xl border border-[#E3DED3] bg-white">
          <div className="flex items-center justify-between border-b border-[#EEEAE1] px-5 py-4"><h2 className="text-sm font-black text-[#00704A]">Campanhas</h2><IosButton variant="secondary" onClick={() => open("campaign")}><Plus size={13} /></IosButton></div>
          <div className="space-y-3 p-4">{!data.campaigns.length ? <IosEmpty title="Sem campanhas" /> : data.campaigns.map((campaign) => (
            <article key={campaign.id} className="rounded-2xl border border-[#EEEAE1] p-3">
              <div className="flex justify-between gap-2"><p className="text-sm font-bold text-gray-700">{campaign.name}</p><IosBadge status={campaign.status} /></div>
              <p className="mt-1 text-[11px] text-gray-400">{campaign.channel?.name || "Sem canal"} · {fmtMetric(campaign.budget, "BRL")}</p>
              <select className={`${inputClass} mt-2 py-1.5 text-xs`} value={campaign.status} onChange={(e) => update(iosApi.updateCampaign, campaign.id, { status: e.target.value })}><option value="DRAFT">Rascunho</option><option value="ACTIVE">Ativa</option><option value="COMPLETED">Concluída</option><option value="CANCELED">Cancelada</option></select>
            </article>
          ))}</div>
        </section>

        <section className="rounded-3xl border border-[#E3DED3] bg-white">
          <div className="flex items-center justify-between border-b border-[#EEEAE1] px-5 py-4"><h2 className="text-sm font-black text-[#00704A]">Parceiros</h2><IosButton variant="secondary" onClick={() => open("partner")}><Plus size={13} /></IosButton></div>
          <div className="space-y-3 p-4">{!data.partners.length ? <IosEmpty title="Sem parceiros" /> : data.partners.map((partner) => (
            <article key={partner.id} className="rounded-2xl border border-[#EEEAE1] p-3">
              <div className="flex justify-between gap-2"><p className="text-sm font-bold text-gray-700">{partner.name}</p><IosBadge status={partner.status} /></div>
              <p className="mt-1 text-[11px] text-gray-400">{partner.contactName || "Sem contato"} · {partner.commissionType || "Comissão não definida"}</p>
              <select className={`${inputClass} mt-2 py-1.5 text-xs`} value={partner.status} onChange={(e) => update(iosApi.updatePartner, partner.id, { status: e.target.value })}><option value="PROSPECT">Prospect</option><option value="ACTIVE">Ativo</option><option value="PAUSED">Pausado</option><option value="ENDED">Encerrado</option></select>
            </article>
          ))}</div>
        </section>

        <section className="rounded-3xl border border-[#E3DED3] bg-white">
          <div className="flex items-center justify-between border-b border-[#EEEAE1] px-5 py-4"><h2 className="text-sm font-black text-[#00704A]">Comissões</h2><IosButton variant="secondary" onClick={() => open("commission")}><Plus size={13} /></IosButton></div>
          <div className="space-y-3 p-4">{!data.commissions.length ? <IosEmpty title="Sem comissões" /> : data.commissions.map((commission) => (
            <article key={commission.id} className="rounded-2xl border border-[#EEEAE1] p-3">
              <div className="flex justify-between gap-2"><p className="text-sm font-bold text-gray-700">{commission.description}</p><IosBadge status={commission.status} /></div>
              <p className="mt-1 text-lg font-black text-[#00704A]">{fmtMetric(commission.amount, "BRL")}</p>
              <p className="text-[11px] text-gray-400">{commission.partner?.name || "Sem parceiro"} · venc. {fmtDate(commission.dueDate)}</p>
              <select className={`${inputClass} mt-2 py-1.5 text-xs`} value={commission.status} onChange={(e) => update(iosApi.updateCommission, commission.id, { status: e.target.value })}><option value="PENDING">Pendente</option><option value="APPROVED">Aprovada</option><option value="PAID">Paga</option><option value="CANCELED">Cancelada</option></select>
            </article>
          ))}</div>
        </section>
      </div>

      <IosModal open={Boolean(mode)} title={mode ? CONFIG[mode].title : ""} onClose={() => setMode(null)} width="max-w-2xl">
        {mode && (
          <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
            {["channel", "campaign", "partner"].includes(mode) && <IosField label="Nome"><input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></IosField>}
            {mode === "channel" && <><IosField label="Categoria"><input className={inputClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></IosField><IosField label="Orçamento mensal"><input type="number" step="0.01" className={inputClass} value={form.monthlyBudget} onChange={(e) => setForm({ ...form, monthlyBudget: e.target.value })} /></IosField></>}
            {mode === "campaign" && <><IosField label="Canal"><select className={inputClass} value={form.channelId} onChange={(e) => setForm({ ...form, channelId: e.target.value })}><option value="">Sem canal</option>{data.channels.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></IosField><IosField label="Objetivo"><input className={inputClass} value={form.objective} onChange={(e) => setForm({ ...form, objective: e.target.value })} /></IosField><IosField label="Início"><input type="date" className={inputClass} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></IosField><IosField label="Fim"><input type="date" className={inputClass} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></IosField><IosField label="Orçamento"><input type="number" step="0.01" className={inputClass} value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} /></IosField></>}
            {mode === "partner" && <><IosField label="Contato"><input className={inputClass} value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} /></IosField><IosField label="E-mail"><input type="email" className={inputClass} value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} /></IosField><IosField label="Tipo de comissão"><select className={inputClass} value={form.commissionType} onChange={(e) => setForm({ ...form, commissionType: e.target.value })}><option value="">Não definida</option><option value="PERCENTAGE">Percentual</option><option value="FIXED">Valor fixo</option></select></IosField><IosField label="Valor"><input type="number" step="0.01" className={inputClass} value={form.commissionValue} onChange={(e) => setForm({ ...form, commissionValue: e.target.value })} /></IosField></>}
            {mode === "commission" && <><IosField label="Descrição"><input className={inputClass} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required /></IosField><IosField label="Valor"><input type="number" step="0.01" className={inputClass} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></IosField><IosField label="Parceiro"><select className={inputClass} value={form.partnerId} onChange={(e) => setForm({ ...form, partnerId: e.target.value })}><option value="">Sem parceiro</option>{data.partners.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></IosField><IosField label="Lead"><select className={inputClass} value={form.leadId} onChange={(e) => setForm({ ...form, leadId: e.target.value })}><option value="">Sem lead</option>{data.leads.map((item) => <option key={item.id} value={item.id}>{item.clinicName || item.name}</option>)}</select></IosField><IosField label="Vencimento"><input type="date" className={inputClass} value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></IosField></>}
            <div className="md:col-span-2"><IosField label="Notas"><textarea className={`${inputClass} min-h-20`} value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></IosField></div>
            <div className="flex justify-end gap-2 md:col-span-2"><IosButton variant="ghost" onClick={() => setMode(null)}>Cancelar</IosButton><IosButton type="submit" disabled={saving}>Salvar</IosButton></div>
          </form>
        )}
      </IosModal>
    </IosLayout>
  );
}
