import { useState } from "react";
import { ChevronDown, RotateCcw, Save, AlertTriangle, HelpCircle } from "lucide-react";
import { PREMISSAS_PADRAO, totalInfra, totalOutrosFixos, somaMix, somaSocios } from "./calculadora";

// Formatação dos inputs por tipo
const fmtBRL = (n) => `R$ ${Number(n).toLocaleString("pt-BR")}`;

// Campo numérico genérico com label, tooltip e sufixo
function Campo({ label, value, onChange, suffix = "", step = "1", min = "0", tooltip }) {
  return (
    <div className="flex items-center justify-between gap-2 py-1">
      <label className="text-xs text-gray-600 flex items-center gap-1 flex-1 min-w-0">
        <span className="truncate">{label}</span>
        {tooltip && (
          <span className="group relative shrink-0">
            <HelpCircle size={12} className="text-gray-300 hover:text-gray-500 cursor-help" />
            <span className="hidden group-hover:block absolute left-0 bottom-5 z-30 w-52 bg-[#00704A] text-white text-[10px] leading-snug rounded-lg p-2 shadow-lg">
              {tooltip}
            </span>
          </span>
        )}
      </label>
      <div className="flex items-center gap-1 shrink-0">
        {suffix === "R$" && <span className="text-[10px] text-gray-400">R$</span>}
        <input
          type="number"
          value={value}
          min={min}
          step={step}
          onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
          className="w-20 border border-[#DDD8CC] rounded-lg px-2 py-1 text-xs text-right focus:outline-none focus:border-[#00704A]"
        />
        {suffix === "%" && <span className="text-[10px] text-gray-400">%</span>}
        {suffix === "×" && <span className="text-[10px] text-gray-400">×</span>}
      </div>
    </div>
  );
}

// Seção colapsável
function Secao({ titulo, children, subtotal, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-[#E6E2D8]">
      <button onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-[#F2F0EB] transition">
        <span className="text-xs font-semibold text-[#00704A] uppercase tracking-wide">{titulo}</span>
        <div className="flex items-center gap-2">
          {subtotal != null && <span className="text-[10px] text-gray-400">{fmtBRL(subtotal)}</span>}
          <ChevronDown size={14} className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </button>
      {open && <div className="px-3 pb-3 space-y-0.5">{children}</div>}
    </div>
  );
}

export default function PremissasPanel({ premissas, setPremissas, onSave, dirty }) {
  const p = premissas;
  const set = (campo) => (val) => setPremissas({ ...p, [campo]: val === "" ? "" : val });

  // Para % os campos exibem 0-100, mas guardamos 0-1
  const setPct = (campo) => (val) => setPremissas({ ...p, [campo]: val === "" ? 0 : Number(val) / 100 });
  const getPct = (campo) => (p[campo] * 100);

  const mixOk = Math.abs(somaMix(p) - 1) < 0.001;
  const sociosOk = Math.abs(somaSocios(p) - 1) < 0.001;

  return (
    <div className="w-full lg:w-72 lg:shrink-0 bg-white border border-[#E6E2D8] rounded-2xl overflow-hidden flex flex-col max-h-[calc(100vh-180px)]">
      {/* Header */}
      <div className="px-3 py-3 border-b border-[#E6E2D8] flex items-center justify-between bg-[#F2F0EB]">
        <span className="text-sm font-bold text-[#00704A]">Premissas</span>
        <div className="flex items-center gap-1.5">
          <button onClick={() => { if (confirm("Restaurar todos os valores padrão?")) setPremissas({ ...PREMISSAS_PADRAO }); }}
            title="Restaurar padrões"
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#DDD8CC] text-gray-400 hover:text-[#00704A] transition">
            <RotateCcw size={12} />
          </button>
          <button onClick={onSave}
            className="relative flex items-center gap-1 bg-[#00704A] hover:bg-[#1E3932] text-white px-3 py-1.5 rounded-lg text-xs font-medium transition">
            <Save size={12} /> Salvar
            {dirty && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border border-white" />}
          </button>
        </div>
      </div>

      {/* Seções */}
      <div className="overflow-y-auto flex-1">
        <Secao titulo="Planos & Preços" defaultOpen>
          <Campo label="Preço Solo"    value={p.precoSolo}    onChange={set("precoSolo")}    suffix="R$" />
          <Campo label="Preço Clínica" value={p.precoClinica} onChange={set("precoClinica")} suffix="R$" />
          <Campo label="Preço Pro"     value={p.precoPro}     onChange={set("precoPro")}     suffix="R$" />
          <Campo label="Mix Solo"      value={getPct("mixSolo")}    onChange={setPct("mixSolo")}    suffix="%" />
          <Campo label="Mix Clínica"   value={getPct("mixClinica")} onChange={setPct("mixClinica")} suffix="%" />
          <Campo label="Mix Pro"       value={getPct("mixPro")}     onChange={setPct("mixPro")}     suffix="%" />
          {!mixOk && (
            <p className="flex items-center gap-1 text-[10px] text-red-500 mt-1">
              <AlertTriangle size={11} /> Mix soma {(somaMix(p) * 100).toFixed(0)}% (deve ser 100%)
            </p>
          )}
        </Secao>

        <Secao titulo="Custos Fixos — Infra" subtotal={totalInfra(p)}>
          <Campo label="AWS Fargate"   value={p.awsFargate}   onChange={set("awsFargate")}   suffix="R$" />
          <Campo label="AWS RDS"       value={p.awsRds}       onChange={set("awsRds")}       suffix="R$" />
          <Campo label="AWS S3"        value={p.awsS3}        onChange={set("awsS3")}        suffix="R$" />
          <Campo label="AWS SQS"       value={p.awsSqs}       onChange={set("awsSqs")}       suffix="R$" />
          <Campo label="n8n"           value={p.n8n}          onChange={set("n8n")}          suffix="R$" />
          <Campo label="WhatsApp"      value={p.whatsapp}     onChange={set("whatsapp")}     suffix="R$" />
          <Campo label="Domínio"       value={p.dominio}      onChange={set("dominio")}      suffix="R$" />
          <Campo label="Monitoramento" value={p.monitoramento} onChange={set("monitoramento")} suffix="R$" />
        </Secao>

        <Secao titulo="Custos Fixos — Operacionais" subtotal={totalOutrosFixos(p)}>
          <Campo label="Contador"          value={p.contador}         onChange={set("contador")}         suffix="R$" />
          <Campo label="Jurídico"          value={p.juridico}         onChange={set("juridico")}         suffix="R$" />
          <Campo label="Marketing"         value={p.marketing}        onChange={set("marketing")}        suffix="R$" />
          <Campo label="SaaS internos"     value={p.saasInternos}     onChange={set("saasInternos")}     suffix="R$" />
          <Campo label="Contingência fixa" value={p.contingenciaFixa} onChange={set("contingenciaFixa")} suffix="R$" />
        </Secao>

        <Secao titulo="Custos Variáveis">
          <Campo label="Gateway Asaas" value={(p.gatewayPct * 100).toFixed(2)} onChange={(v) => setPremissas({ ...p, gatewayPct: Number(v) / 100 })} suffix="%" step="0.01"
            tooltip="Taxa cobrada pelo Asaas sobre o MRR de assinaturas — independente do rev share" />
          <Campo label="IA / cliente"  value={p.iaRCliMes}        onChange={set("iaRCliMes")}        suffix="R$" step="0.5"
            tooltip="Custo estimado de tokens LLM por cliente ativo por mês" />
          <Campo label="Assinatura dig." value={p.assinaturaDigital} onChange={set("assinaturaDigital")} suffix="R$" step="0.5" />
          <Campo label="CS / Suporte"  value={p.cs}               onChange={set("cs")}               suffix="R$" step="0.5" />
          <Campo label="Contingência var." value={getPct("contingenciaVarPct")} onChange={setPct("contingenciaVarPct")} suffix="%"
            tooltip="Buffer para custos imprevistos que escalam com a receita. Recomendado: 2% no early-stage" />
        </Secao>

        <Secao titulo="Sócios">
          <Campo label="Enzo"       value={getPct("pctEnzo")}      onChange={setPct("pctEnzo")}      suffix="%" />
          <Campo label="Ana Flávia" value={getPct("pctAnaFlavia")} onChange={setPct("pctAnaFlavia")} suffix="%" />
          <Campo label="Gean"       value={getPct("pctGean")}      onChange={setPct("pctGean")}      suffix="%" />
          <Campo label="Euriane"    value={getPct("pctEuriane")}   onChange={setPct("pctEuriane")}   suffix="%" />
          <Campo label="Reserva"    value={getPct("pctReserva")}   onChange={setPct("pctReserva")}   suffix="%" />
          {!sociosOk && (
            <p className="flex items-center gap-1 text-[10px] text-red-500 mt-1">
              <AlertTriangle size={11} /> Soma {(somaSocios(p) * 100).toFixed(0)}% (deve ser 100%)
            </p>
          )}
          <p className="text-[10px] text-gray-400 mt-1 leading-tight">
            Sem pró-labore — retirada vem só do lucro disponível.
          </p>
        </Secao>

        <Secao titulo="Política de Caixa">
          <Campo label="Multiplicador CF" value={p.caixaMultiplicador} onChange={set("caixaMultiplicador")} suffix="×" step="0.1"
            tooltip="A empresa retém X vezes os custos fixos mensais antes de distribuir. Padrão conservador: 1,5×" />
          <Campo label="Provisão tributária" value={getPct("provisaoTributaria")} onChange={setPct("provisaoTributaria")} suffix="%"
            tooltip="Percentual reservado para impostos sobre distribuição de lucros" />
          <Campo label="Churn buffer" value={getPct("churnBuffer")} onChange={setPct("churnBuffer")} suffix="%"
            tooltip="Percentual da receita mensal reservado para absorver perdas por churn inesperado" />
        </Secao>

        <Secao titulo="Asaas Rev Share">
          <Campo label="Ticket procedimento" value={p.asaasTicketProc}  onChange={set("asaasTicketProc")}  suffix="R$" />
          <Campo label="Procs / cliente"     value={p.asaasProcsCliente} onChange={set("asaasProcsCliente")} step="0.5" />
          <Campo label="% adesão"            value={getPct("asaasPctAdesao")} onChange={setPct("asaasPctAdesao")} suffix="%" />
          <Campo label="Rev share / transação" value={p.asaasRevShare}  onChange={set("asaasRevShare")}    suffix="R$" step="0.1" />
          <Campo label="Fator conservador"  value={getPct("asaasFatorConservador")} onChange={setPct("asaasFatorConservador")} suffix="%" />
          <p className="text-[10px] text-amber-600 mt-1 leading-tight">
            Depende de adesão ativa dos clientes. O fator conservador evita planejar com receita incerta.
          </p>
        </Secao>
      </div>
    </div>
  );
}
