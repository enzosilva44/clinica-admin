import { useEffect, useState } from "react";
import { DollarSign, RefreshCw, AlertTriangle, CloudDownload, Megaphone, Wrench, Clock, Coins } from "lucide-react";
import AdminLayout from "../../components/AdminLayout";
import adminApi from "../../services/api";
import TecBreadcrumb from "./TecBreadcrumb";
import MiniChart from "./MiniChart";

// Categorias de preço da Meta. Marketing custa ~9× Utility por mensagem —
// a cor separa visualmente o que pesa no bolso.
const CATEGORIA = {
  MARKETING:      { label: "Marketing",      color: "#CBA258", icon: Megaphone },
  UTILITY:        { label: "Utilidade",      color: "#00704A", icon: Wrench },
  AUTHENTICATION: { label: "Autenticação",   color: "#0EA5E9", icon: Wrench },
  SERVICE:        { label: "Serviço",        color: "#7C3AED", icon: Wrench },
};

const PLAN_COLORS = {
  solo:         "bg-gray-100 text-gray-600",
  essencial:    "bg-sky-100 text-sky-700",
  profissional: "bg-emerald-100 text-emerald-700",
  clinica:      "bg-emerald-100 text-emerald-700",
  enterprise:   "bg-amber-100 text-amber-700",
  dev:          "bg-purple-100 text-purple-700",
};

const JANELAS = [7, 30, 90];

function usd(n) {
  return `US$ ${(n ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function num(n) {
  return new Intl.NumberFormat("pt-BR").format(n ?? 0);
}
function brl(n) {
  return (n ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function Card({ icon: Icon, label, valor, sub, color = "#00704A" }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E6E2D8] p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}1A` }}>
          <Icon size={17} style={{ color }} />
        </div>
        <span className="text-sm font-bold text-gray-700">{label}</span>
      </div>
      <p className="text-2xl font-black" style={{ color }}>{valor}</p>
      {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function CustoWhatsApp() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [days, setDays] = useState(30);
  const [espera, setEspera] = useState(0);   // segundos até liberar nova sync
  const [aviso, setAviso] = useState(null);  // 429: limite, não erro

  function load(d = days) {
    setLoading(true);
    adminApi.get(`/admin/whatsapp-cost?days=${d}`)
      .then((r) => { setData(r.data); setErr(null); })
      .catch((e) => setErr(e?.response?.data?.error || "Não foi possível carregar o custo."))
      .finally(() => setLoading(false));
  }

  // Puxa da Meta agora, em vez de esperar o cron das 05:00.
  // A trava de intervalo mínimo é do servidor (429) — aqui só desabilitamos o
  // botão durante a espera, para o limite ficar visível antes do clique.
  function sync() {
    setSyncing(true);
    adminApi.post("/admin/whatsapp-cost/sync", { dias: days })
      .then(() => { setErr(null); setEspera(0); load(); })
      .catch((e) => {
        // 429 não é falha: é a proteção contra estourar o rate limit da Graph.
        if (e?.response?.status === 429) {
          setEspera(e.response.data?.retryEmSegundos ?? 60);
          setAviso(e.response.data?.error || "Sincronizado há instantes.");
        } else {
          setErr(e?.response?.data?.error || "Falha ao sincronizar com a Meta.");
        }
      })
      .finally(() => setSyncing(false));
  }

  // Contagem regressiva do bloqueio, para o botão voltar sozinho.
  useEffect(() => {
    if (espera <= 0) { setAviso(null); return; }
    const t = setTimeout(() => setEspera((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [espera]);

  useEffect(() => { load(days); /* eslint-disable-next-line */ }, [days]);

  const t = data?.totais;
  const serie = (data?.porDia ?? []).map((d) => ({ v: d.custoUsd }));
  const sync_ = data?.ultimaSync ? new Date(data.ultimaSync).toLocaleString("pt-BR") : null;

  return (
    <AdminLayout>
      <TecBreadcrumb
        title="Custo WhatsApp"
        subtitle="O que a Meta cobra pelas mensagens — espelho do WhatsApp Manager, com rateio por clínica."
      />

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex gap-1.5">
          {JANELAS.map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition ${
                days === d
                  ? "border-[#00704A] bg-[#00704A]/10 text-[#00704A]"
                  : "border-[#E6E2D8] text-gray-500 hover:border-[#00704A]/40"
              }`}
            >
              {d} dias
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {sync_ && <span className="text-[11px] text-gray-400">Atualizado em {sync_}</span>}
          <button
            onClick={sync}
            disabled={syncing || espera > 0}
            title={espera > 0 ? "Os números da Meta não mudam nesse intervalo." : undefined}
            className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl border border-[#E6E2D8] text-gray-600 hover:border-[#00704A]/40 hover:text-[#00704A] transition disabled:opacity-50 disabled:hover:border-[#E6E2D8] disabled:hover:text-gray-600"
          >
            <CloudDownload size={13} className={syncing ? "animate-pulse" : ""} />
            {syncing ? "Sincronizando…" : espera > 0 ? `Aguarde ${espera}s` : "Sincronizar com a Meta"}
          </button>
          <button
            onClick={() => load()}
            disabled={loading}
            className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl border border-[#E6E2D8] text-gray-600 hover:border-[#00704A]/40 hover:text-[#00704A] transition disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Atualizar
          </button>
        </div>
      </div>

      {err && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl px-5 py-4 text-sm flex items-center gap-2 mb-4">
          <AlertTriangle size={15} /> {err}
        </div>
      )}

      {/* Limite de sincronização — âmbar, não vermelho: nada falhou, o dado em
          tela já é o mais recente que a Meta tem. */}
      {aviso && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-2xl px-5 py-4 text-sm flex items-center gap-2 mb-4">
          <Clock size={15} /> {aviso}
        </div>
      )}

      {/* Totais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
        <Card
          icon={DollarSign}
          label="Custo no período"
          valor={usd(t?.custoUsd)}
          sub="cobrado pela Meta em dólar"
        />

        {/* Estimativa em reais — só aparece se a cotação veio. USD é o valor
            de fato; isto é conveniência de leitura, não o que será faturado. */}
        {data?.cambio && (
          <Card
            icon={Coins}
            label="Estimativa em reais"
            valor={brl(data.cambio.custoBrlEstimado)}
            sub={
              `≈ dólar a ${data.cambio.usdBrl.toLocaleString("pt-BR", { minimumFractionDigits: 4, maximumFractionDigits: 4 })}` +
              (data.cambio.expirada ? " · cotação pode estar defasada" : "")
            }
            color="#CBA258"
          />
        )}
        <Card
          icon={Wrench}
          label="Mensagens pagas"
          valor={num(t?.mensagensPagas)}
          sub={`${num(t?.mensagensGratis)} gratuitas · ${num(t?.mensagens)} no total`}
          color="#0EA5E9"
        />
        <Card
          icon={DollarSign}
          label="Custo médio"
          valor={usd(t?.custoMedioPagoUsd)}
          sub="por mensagem paga"
          color="#7C3AED"
        />
        <div className="bg-white rounded-2xl border border-[#E6E2D8] p-5">
          <p className="text-sm font-bold text-gray-700 mb-2">Custo por dia</p>
          <MiniChart series={serie} color="#00704A" height={56} />
        </div>
      </div>

      {data?.cambio && (
        <p className="text-[11px] text-gray-400 -mt-3 mb-6 leading-relaxed">
          A Meta cobra em dólar. O valor em reais é estimativa pela cotação
          comercial ({data.cambio.fonte}
          {data.cambio.cotadoEm ? `, ${data.cambio.cotadoEm}` : ""}) e não inclui
          spread nem IOF do cartão — a fatura final costuma ficar acima disso.
        </p>
      )}

      {/* Por categoria */}
      <div className="bg-white rounded-2xl border border-[#E6E2D8] overflow-hidden mb-6">
        <div className="px-5 py-3.5 border-b border-[#E6E2D8]">
          <span className="text-sm font-bold text-[#00704A]">Por categoria de mensagem</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase text-gray-400 border-b border-[#F2F0EB]">
                <th className="px-5 py-2.5 font-semibold">Categoria</th>
                <th className="px-5 py-2.5 font-semibold">Entregues</th>
                <th className="px-5 py-2.5 font-semibold">Pagas</th>
                <th className="px-5 py-2.5 font-semibold">Gratuitas</th>
                <th className="px-5 py-2.5 font-semibold">Custo médio</th>
                <th className="px-5 py-2.5 font-semibold">Custo total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2F0EB]">
              {loading && !data ? (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-400 text-xs">Carregando…</td></tr>
              ) : (data?.porCategoria ?? []).length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-400 text-xs">
                  Nenhum dado sincronizado. Clique em "Sincronizar com a Meta".
                </td></tr>
              ) : (
                data.porCategoria.map((c) => {
                  const meta = CATEGORIA[c.categoria] ?? { label: c.categoria, color: "#94A3B8" };
                  return (
                    <tr key={c.categoria} className="hover:bg-[#FAF9F6]">
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center gap-2 font-semibold text-gray-700">
                          <span className="w-2 h-2 rounded-full" style={{ background: meta.color }} />
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-600">{num(c.volume)}</td>
                      <td className="px-5 py-3 text-gray-600">{num(c.volumePago)}</td>
                      <td className="px-5 py-3 text-gray-400">{num(c.volumeGratis)}</td>
                      <td className="px-5 py-3 text-gray-500">{usd(c.custoMedioUsd)}</td>
                      <td className="px-5 py-3 font-bold" style={{ color: meta.color }}>{usd(c.custoUsd)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rateio por clínica */}
      <div className="bg-white rounded-2xl border border-[#E6E2D8] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#E6E2D8] flex items-center justify-between gap-3">
          <span className="text-sm font-bold text-[#00704A]">Rateio por clínica</span>
          {data?.naoAtribuido > 0 && (
            <span className="text-[11px] text-gray-400">
              {usd(data.naoAtribuido)} não atribuído
            </span>
          )}
        </div>

        {/* O número é único e compartilhado: a Meta cobra a WABA inteira e não
            diz de qual clínica foi cada mensagem. Deixar isso explícito evita
            que alguém trate a coluna como fatura. */}
        <div className="px-5 py-2.5 bg-[#FAF9F6] border-b border-[#F2F0EB]">
          <p className="text-[11px] text-gray-500 leading-relaxed">
            <strong className="text-gray-600">Estimativa.</strong> A Meta cobra a conta toda e não informa a clínica de
            origem — o custo real de cada categoria é distribuído conforme o volume enviado por clínica.
            Mensagens fora das automações (avisos ao dono, respostas automáticas) ficam em "não atribuído".
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase text-gray-400 border-b border-[#F2F0EB]">
                <th className="px-5 py-2.5 font-semibold">Clínica</th>
                <th className="px-5 py-2.5 font-semibold">Plano</th>
                <th className="px-5 py-2.5 font-semibold">Mensagens</th>
                <th className="px-5 py-2.5 font-semibold">Marketing</th>
                <th className="px-5 py-2.5 font-semibold">Utilidade</th>
                <th className="px-5 py-2.5 font-semibold">Custo estimado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2F0EB]">
              {loading && !data ? (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-400 text-xs">Carregando…</td></tr>
              ) : (data?.clinicas ?? []).length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-400 text-xs">Nenhum envio no período.</td></tr>
              ) : (
                data.clinicas.map((c) => (
                  <tr key={c.id} className="hover:bg-[#FAF9F6]">
                    <td className="px-5 py-3">
                      <p className="font-semibold text-gray-700 truncate max-w-[220px]">{c.name}</p>
                      <p className="text-[11px] text-gray-400 truncate max-w-[220px]">{c.email}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${PLAN_COLORS[c.plan] ?? "bg-gray-100 text-gray-600"}`}>
                        {c.plan}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{num(c.mensagens)}</td>
                    <td className="px-5 py-3 text-gray-500">{num(c.porCategoria?.MARKETING ?? 0)}</td>
                    <td className="px-5 py-3 text-gray-500">{num(c.porCategoria?.UTILITY ?? 0)}</td>
                    <td className="px-5 py-3">
                      <span className="font-bold text-[#00704A]">{usd(c.custoUsd)}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
