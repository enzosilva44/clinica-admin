import { useMemo, useState } from "react";
import {
  ticketMedio, mrr, custosVariaveis, margemBruta,
  totalCustosFixos, ebitda, ebitdaPct,
} from "./calculadora";

const fmt = (n) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 });
const pct = (n) => `${(n * 100).toFixed(1)}%`;

const MAX_LIMITE = 1000;

// Tabela de projeção cliente a cliente (1 até o limite escolhido).
// Reage automaticamente quando qualquer premissa muda, pois deriva tudo do motor.
export default function ProjecaoUnitaria({ premissas }) {
  const [limite, setLimite] = useState(10);

  const linhas = useMemo(() => {
    const qtd = Math.min(Math.max(1, limite || 1), MAX_LIMITE);
    const fixo = totalCustosFixos(premissas);
    return Array.from({ length: qtd }, (_, i) => {
      const n = i + 1;
      return {
        n,
        receita: mrr(premissas, n),
        custosVar: custosVariaveis(premissas, n),
        receitaLiquida: margemBruta(premissas, n),
        custoFixo: fixo,
        resultado: ebitda(premissas, n),
        margem: ebitdaPct(premissas, n),
      };
    });
  }, [premissas, limite]);

  const PRESETS = [10, 25, 50, 100];

  return (
    <div className="bg-white border border-[#E6E2D8] rounded-2xl overflow-hidden">
      <div className="px-5 py-3 border-b border-[#E6E2D8] bg-[#F2F0EB] flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm font-bold text-[#00704A]">Projeção por cliente (1 a {Math.min(Math.max(1, limite || 1), MAX_LIMITE)})</span>
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
          <thead className="bg-[#FAFAF9] text-[10px] text-gray-400 uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-2.5">Clientes</th>
              <th className="text-right px-4 py-2.5">Receita Bruta</th>
              <th className="text-right px-4 py-2.5">Custos Variáveis</th>
              <th className="text-right px-4 py-2.5">Receita Líquida</th>
              <th className="text-right px-4 py-2.5">Custo Fixo Total</th>
              <th className="text-right px-4 py-2.5">Resultado</th>
              <th className="text-center px-4 py-2.5">Margem</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => {
              const pos = l.resultado >= 0;
              const corRes = pos ? "text-green-600" : "text-red-500";
              return (
                <tr key={l.n} className="border-t border-[#E6E2D8]">
                  <td className="px-4 py-2.5 font-medium text-[#00704A]">{l.n}</td>
                  <td className="px-4 py-2.5 text-right text-gray-600">{fmt(l.receita)}</td>
                  <td className="px-4 py-2.5 text-right text-gray-500">{fmt(l.custosVar)}</td>
                  <td className="px-4 py-2.5 text-right text-gray-600">{fmt(l.receitaLiquida)}</td>
                  <td className="px-4 py-2.5 text-right text-gray-500">{fmt(l.custoFixo)}</td>
                  <td className={`px-4 py-2.5 text-right font-semibold ${corRes}`}>{fmt(l.resultado)}</td>
                  <td className={`px-4 py-2.5 text-center font-bold ${corRes}`}>{pct(l.margem)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
