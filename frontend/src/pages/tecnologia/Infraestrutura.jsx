import { useEffect, useState } from "react";
import { Cloud, DollarSign, ShieldCheck, AlertTriangle, RefreshCw, Server, Database, Check, X } from "lucide-react";
import AdminLayout from "../../components/AdminLayout";
import adminApi from "../../services/api";
import TecBreadcrumb from "./TecBreadcrumb";
import toast from "react-hot-toast";

function fmtUSD(n) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n ?? 0);
}
function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function BackupCard({ icon: Icon, title, data }) {
  const ok = data?.found >= data?.expected;
  return (
    <div className="bg-white rounded-2xl border border-[#E6E2D8] overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[#E6E2D8] flex items-center justify-between">
        <div>
          <span className="text-sm font-bold text-[#00704A] flex items-center gap-2"><Icon size={15} /> {title}</span>
          {data?.sources && (
            <p className="text-[10px] text-gray-400 mt-0.5">
              {data.sources.automated} nativo{data.sources.automated !== 1 ? "s" : ""} + {data.sources.awsbackup} AWS Backup ({data.total} snapshots)
            </p>
          )}
          {!data?.sources && data?.total != null && (
            <p className="text-[10px] text-gray-400 mt-0.5">{data.total} imagem{data.total !== 1 ? "ns" : ""}</p>
          )}
        </div>
        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${ok ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
          {ok ? <Check size={12} /> : <X size={12} />}
          {data?.found ?? 0} / {data?.expected ?? 0} dias
        </span>
      </div>
      <div className="divide-y divide-[#F2F0EB]">
        {(data?.items ?? []).length === 0 ? (
          <p className="text-xs text-gray-400 py-6 text-center">Nenhum backup no período.</p>
        ) : (
          data.items.map((b) => (
            <div key={b.id} className="px-5 py-3 flex items-center gap-3">
              <span className={`w-2 h-2 rounded-full shrink-0 ${b.status === "available" ? "bg-green-500" : "bg-amber-500"}`} />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-mono text-gray-700 truncate">{b.id}</p>
                <p className="text-[11px] text-gray-400">{fmtDate(b.createdAt)} · {b.status}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function Infraestrutura() {
  const [cost, setCost] = useState(null);
  const [costErr, setCostErr] = useState(null);
  const [costLoading, setCostLoading] = useState(false);
  const [backups, setBackups] = useState(null);
  const [backupsErr, setBackupsErr] = useState(null);
  const [loading, setLoading] = useState(true);

  // Backups são baratos → carregam ao abrir
  function loadBackups() {
    setLoading(true);
    adminApi.get("/admin/infra/backups")
      .then((r) => { setBackups(r.data); setBackupsErr(null); })
      .catch((e) => setBackupsErr(e?.response?.data?.error || "Backups AWS indisponíveis"))
      .finally(() => setLoading(false));
  }

  // Cost Explorer custa US$0,01/chamada → só busca quando o usuário clica em Atualizar
  function loadCost() {
    setCostLoading(true);
    adminApi.get("/admin/infra/cost")
      .then((r) => { setCost(r.data); setCostErr(null); })
      .catch((e) => setCostErr(e?.response?.data?.error || "Custo AWS indisponível"))
      .finally(() => setCostLoading(false));
  }

  useEffect(() => { loadBackups(); }, []);

  const maxCost = Math.max(1, ...(cost?.services ?? []).map((s) => s.amount));

  return (
    <AdminLayout>
      <TecBreadcrumb title="Infraestrutura" subtitle="Custo AWS real do mês e verificação de backups." />

      <div className="flex justify-end mb-4">
        <button onClick={loadBackups} disabled={loading}
          className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-[#00704A] border border-[#E6E2D8] rounded-xl px-3 py-2 bg-white transition disabled:opacity-50">
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Atualizar backups
        </button>
      </div>

      {/* Custo AWS */}
      <div className="bg-white rounded-2xl border border-[#E6E2D8] overflow-hidden mb-6">
        <div className="px-5 py-3.5 border-b border-[#E6E2D8] flex items-center justify-between bg-[#F2F0EB]">
          <span className="text-sm font-bold text-[#00704A] flex items-center gap-2"><Cloud size={15} /> Custo AWS — mês atual</span>
          <div className="flex items-center gap-3">
            {cost?.period && <span className="text-xs text-gray-400">{cost.period.start} → {cost.period.end}</span>}
            <button onClick={loadCost} disabled={costLoading}
              className="flex items-center gap-1.5 text-xs font-medium text-[#00704A] hover:bg-[#F0F7F5] border border-[#00704A]/30 rounded-lg px-2.5 py-1 transition disabled:opacity-50">
              <RefreshCw size={12} className={costLoading ? "animate-spin" : ""} /> {cost ? "Atualizar" : "Buscar custo"}
            </button>
          </div>
        </div>

        {costErr ? (
          <div className="m-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">{costErr}</div>
        ) : !cost && !costLoading ? (
          <div className="p-8 text-center">
            <DollarSign size={28} className="text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Clique em <span className="font-semibold text-[#00704A]">Buscar custo</span> para consultar o gasto do mês.</p>
            <p className="text-[11px] text-gray-300 mt-1">Cada consulta ao AWS Cost Explorer custa US$ 0,01.</p>
          </div>
        ) : cost ? (
          <div className="p-5">
            <div className="flex items-center gap-2 mb-5">
              <DollarSign size={22} className="text-[#00704A]" />
              <span className="text-3xl font-black text-[#00704A]">{fmtUSD(cost.total)}</span>
              <span className="text-xs text-gray-400 mt-2">acumulado no mês</span>
            </div>
            <div className="space-y-2.5">
              {cost.services.map((s) => (
                <div key={s.service} className="flex items-center gap-3">
                  <span className="text-xs text-gray-600 w-56 truncate shrink-0">{s.service}</span>
                  <div className="flex-1 h-2 bg-[#F2F0EB] rounded-full overflow-hidden">
                    <div className="h-full bg-[#00704A] rounded-full" style={{ width: `${(s.amount / maxCost) * 100}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 w-20 text-right shrink-0">{fmtUSD(s.amount)}</span>
                </div>
              ))}
              {cost.services.length === 0 && <p className="text-xs text-gray-400">Sem custos registrados ainda no mês.</p>}
            </div>
          </div>
        ) : (
          <div className="h-40 animate-pulse" />
        )}
      </div>

      {/* Backups */}
      <div className="flex items-center gap-2 mb-3">
        <ShieldCheck size={15} className="text-[#00704A]" />
        <h2 className="text-sm font-bold text-[#00704A]">Backups — últimos {backups?.days ?? 3} dias</h2>
      </div>

      {backupsErr ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-sm text-amber-700">{backupsErr}</div>
      ) : backups ? (
        <>
          {backups.failures?.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 mb-4 flex items-start gap-3">
              <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-700">{backups.failures.length} falha(s) de backup no período</p>
                {backups.failures.map((f) => (
                  <p key={f.id} className="text-xs text-red-500 mt-0.5">{f.resource} · {f.state} · {fmtDate(f.createdAt)} {f.message ? `· ${f.message}` : ""}</p>
                ))}
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BackupCard icon={Server}   title="EC2 (AMIs)"       data={backups.ec2} />
            <BackupCard icon={Database} title="RDS (snapshots)"  data={backups.rds} />
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2].map((i) => <div key={i} className="h-48 bg-white rounded-2xl animate-pulse border border-[#E6E2D8]" />)}
        </div>
      )}
    </AdminLayout>
  );
}
