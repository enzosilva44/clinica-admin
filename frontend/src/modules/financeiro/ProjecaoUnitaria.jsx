import { useMemo, useState } from "react";
import {
  ticketMedio, mrr, revShareAsaas, receitaTotal, custosVariaveis,
  totalCustosFixos, ebitda, ebitdaPct, caixaMinimo, faltaReservar, lucroDisponivel,
} from "./calculadora";

const fmt = (n) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 });
const pct = (n) => `${(n * 100).toFixed(1)}%`;

const MAX_LIMITE = 1000;

// Tabela de projeção cliente a cliente (1 até o limite escolhido).
// Agrupada em CUSTOS | RECEITA | RESULTADO. Reage a qualquer premissa.
export default function ProjecaoUnitaria({ premissas }) {
  const [limite, setLimite] = useState(10);

  const linhas = useMemo(() => {
    const qtd = Math.min(Math.max(1, limite || 1), MAX_LIMITE);
    const fixo = totalCustosFixos(premissas);
    return Array.from({ length: qtd }, (_, i) => {
      const n = i + 1;
      const custoVar = custosVariaveis(premissas, n);
      const assinaturas = mrr(premissas, n);
      const asaas = revShareAsaas(premissas, n);
      return {
        n,
        custoVar,
        custoFixo: fixo,
        custoTotal: custoVar + fixo,
        assinaturas,
        asaas,
        receitaTot: receitaTotal(premissas, n),
        resultado: ebitda(premissas, n),
        margem: ebitdaPct(premissas, n),
        reservaAlvo: caixaMinimo(premissas, n),
        faltaReservar: faltaReservar(premissas, n),
        disponivel: lucroDisponivel(premissas, n),
      };
    });
  }, [premissas, limite]);

  const PRESETS = [10, 25, 50, 100];
  const limiteAtual = Math.min(Math.max(1, limite || 1), MAX_LIMITE);

  const th = "px-3 py-2 font-medium";
  const td = "px-3 py-2.5 text-right tabular-nums";

  return (
    <div className="bg-white border border-[#E6E2D8] rounded-2xl overflow-hidden">
      <div className="px-5 py-3 border-b border-[#E6E2D8] bg-[#F2F0EB] flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm font-bold text-[#00704A]">Projeção por cliente (1 a {limiteAtual})</span>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-gray-400">Ticket médio {fmt(ticketMedio(premissas))}</span>
          <div className="flex items-center gap-1.5">
            <label className="text-[11px] text-gray-500">Até</label>
            <input
              type="number" min={1} max={MAX_LIMITE} value={limite}
              onChange={(e) => setLimite(e.target.value === "" ? "" : Number(e.target.value))}
              onBlur={(e) => { if (e.target.value === "") setLimite(10); }}
              className="w-20 border border-[#DDD8CC] rounded-lg px-2 py-1 text-sm text-right bg-white focus:border-[#00704A] focus:outline-none"
            />
            <span className="text-[11px] text-gray-400">clientes</span>
          </div>
          <div className="flex gap-1">
            {PRESETS.map((v) => (
              <button key={v} onClick={() => setLimite(v)}
                className={`px-2 py-1 rounded-lg text-[11px] font-medium transition ${
                  limite === v ? "bg-[#00704A] text-white" : "border border-[#DDD8CC] text-gray-500 hover:border-[#00704A] hover:text-[#00704A]"
                }`}>
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          {/* Linha de grupos */}
          <thead>
            <tr className="text-[10px] uppercase tracking-wide text-white">
              <th className="bg-[#00704A] px-3 py-1.5" rowSpan={2}>Clientes</th>
              <th className="bg-red-500/90 px-3 py-1.5 border-l border-white/20" colSpan={3}>Custos</th>
              <th className="bg-[#00704A] px-3 py-1.5 border-l border-white/20" colSpan={3}>Receita</th>
              <th className="bg-[#1E3932] px-3 py-1.5 border-l border-white/20" colSpan={5}>Resultado</th>
            </tr>
            {/* Linha de colunas */}
            <tr className="bg-[#FAFAF9] text-[10px] text-gray-400 uppercase tracking-wide">
              <th className={`${th} text-right border-l border-[#E6E2D8]`}>Variável</th>
              <th className={`${th} text-right`}>Fixo</th>
              <th className={`${th} text-right`}>Total</th>
              <th className={`${th} text-right border-l border-[#E6E2D8]`}>Assin. (MRR)</th>
              <th className={`${th} text-right`}>Asaas</th>
              <th className={`${th} text-right`}>Total</th>
              <th className={`${th} text-right border-l border-[#E6E2D8]`}>EBITDA</th>
              <th className={`${th} text-center`}>Margem</th>
              <th className={`${th} text-right`}>Reserva-alvo</th>
              <th className={`${th} text-right`}>Falta reservar</th>
              <th className={`${th} text-right`}>Disponível</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => {
              const pos = l.resultado >= 0;
              const corRes = pos ? "text-green-600" : "text-red-500";
              return (
                <tr key={l.n} className="border-t border-[#E6E2D8] hover:bg-[#F2F0EB]/50">
                  <td className="px-3 py-2.5 font-semibold text-[#00704A] text-center">{l.n}</td>
                  {/* Custos */}
                  <td className={`${td} text-gray-500 border-l border-[#E6E2D8]`}>{fmt(l.custoVar)}</td>
                  <td className={`${td} text-gray-500`}>{fmt(l.custoFixo)}</td>
                  <td className={`${td} font-medium text-gray-700`}>{fmt(l.custoTotal)}</td>
                  {/* Receita */}
                  <td className={`${td} text-gray-600 border-l border-[#E6E2D8]`}>{fmt(l.assinaturas)}</td>
                  <td className={`${td} text-gray-500`}>{fmt(l.asaas)}</td>
                  <td className={`${td} font-medium text-gray-700`}>{fmt(l.receitaTot)}</td>
                  {/* Resultado */}
                  <td className={`${td} font-semibold ${corRes} border-l border-[#E6E2D8]`}>{fmt(l.resultado)}</td>
                  <td className={`px-3 py-2.5 text-center font-bold ${corRes}`}>{pct(l.margem)}</td>
                  <td className={`${td} text-gray-500`}>{fmt(l.reservaAlvo)}</td>
                  <td className={`${td} ${l.faltaReservar > 0 ? "text-amber-600" : "text-gray-300"}`}>{l.faltaReservar > 0 ? fmt(l.faltaReservar) : "✓"}</td>
                  <td className={`${td} font-medium text-[#00704A]`}>{l.disponivel > 0 ? fmt(l.disponivel) : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="px-5 py-2.5 border-t border-[#E6E2D8] bg-[#FAFAF9] text-[11px] text-gray-400 leading-relaxed">
        <span className="font-medium text-gray-500">Reserva-alvo</span> = quanto precisa estar guardado em caixa (estoque, não custo mensal). {" "}
        <span className="font-medium text-gray-500">Falta reservar</span> = reserva-alvo − caixa atual (informado nas premissas); "✓" quando a meta já foi atingida. {" "}
        <span className="font-medium text-gray-500">Disponível</span> = EBITDA − impostos − o que ainda falta reservar. Atingida a reserva, o lucro é liberado quase inteiro para distribuição.
      </div>
    </div>
  );
}
