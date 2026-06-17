import { useState } from "react";
import { MILESTONES, ebitda, ebitdaPct, lucroDisponivel, retiradaSocio } from "./calculadora";

const fmt = (n) => `R$ ${Math.round(n).toLocaleString("pt-BR")}`;
const pct = (n) => `${(n * 100).toFixed(0)}%`;

// Marcos reduzidos para a tabela do simulador (cabe melhor lado a lado)
const MARCOS = [50, 100, 200, 300, 500];

// Cria uma cópia das premissas com preços de um cenário
function comPrecos(base, precos) {
  return { ...base, precoSolo: precos.solo, precoClinica: precos.clinica, precoPro: precos.pro };
}

function corEbitda(e) {
  return e >= 0.2 ? "text-green-600" : e >= 0 ? "text-amber-500" : "text-red-500";
}

export default function SimuladorTab({ premissas }) {
  // Cenários A/B/C — inicializam com os preços atuais
  const [cenarios, setCenarios] = useState({
    A: { solo: premissas.precoSolo, clinica: premissas.precoClinica, pro: premissas.precoPro },
    B: { solo: premissas.precoSolo + 20, clinica: premissas.precoClinica + 40, pro: premissas.precoPro + 60 },
    C: { solo: Math.max(0, premissas.precoSolo - 20), clinica: Math.max(0, premissas.precoClinica - 40), pro: Math.max(0, premissas.precoPro - 60) },
  });

  const setPreco = (cen, plano) => (e) => {
    const v = e.target.value === "" ? 0 : Number(e.target.value);
    setCenarios((c) => ({ ...c, [cen]: { ...c[cen], [plano]: v } }));
  };

  const LISTA = ["A", "B", "C"];
  const COR_CEN = { A: "#00704A", B: "#CBA258", C: "#4A8EC2" };

  // Ticket médio de cada cenário (usa o mix das premissas)
  const ticket = (precos) =>
    precos.solo * premissas.mixSolo + precos.clinica * premissas.mixClinica + precos.pro * premissas.mixPro;

  return (
    <div className="space-y-4">
      {/* Inputs dos cenários */}
      <div className="bg-white border border-[#E6E2D8] rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-[#E6E2D8] bg-[#F2F0EB]">
          <span className="text-sm font-bold text-[#00704A]">Cenários de Pricing</span>
          <p className="text-[10px] text-gray-400 mt-0.5">
            Mix fixo (Solo {pct(premissas.mixSolo)} · Clínica {pct(premissas.mixClinica)} · Pro {pct(premissas.mixPro)}) — vem das premissas
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#FAFAF9] text-[10px] text-gray-400 uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-2.5">Plano</th>
                {LISTA.map((c) => (
                  <th key={c} className="text-center px-4 py-2.5">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COR_CEN[c] }} />
                      Cenário {c}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { plano: "Solo", key: "solo" },
                { plano: "Clínica", key: "clinica" },
                { plano: "Pro", key: "pro" },
              ].map(({ plano, key }) => (
                <tr key={key} className="border-t border-[#E6E2D8]">
                  <td className="px-4 py-2 font-medium text-[#00704A]">{plano}</td>
                  {LISTA.map((c) => (
                    <td key={c} className="px-4 py-2 text-center">
                      <div className="inline-flex items-center gap-1">
                        <span className="text-[10px] text-gray-400">R$</span>
                        <input
                          type="number" min="0" value={cenarios[c][key]}
                          onChange={setPreco(c, key)}
                          className="w-20 border border-[#DDD8CC] rounded-lg px-2 py-1 text-xs text-right focus:outline-none focus:border-[#00704A]"
                        />
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="border-t border-[#DDD8CC] bg-[#F2F0EB]">
                <td className="px-4 py-2 font-semibold text-[#00704A]">Ticket médio</td>
                {LISTA.map((c) => (
                  <td key={c} className="px-4 py-2 text-center font-bold text-[#00704A]">{fmt(ticket(cenarios[c]))}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Comparação de margens */}
      <div className="bg-white border border-[#E6E2D8] rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-[#E6E2D8] bg-[#F2F0EB]">
          <span className="text-sm font-bold text-[#00704A]">% Margem EBITDA por cenário</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#FAFAF9] text-[10px] text-gray-400 uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-2.5">Clientes</th>
                {LISTA.map((c) => <th key={c} className="text-center px-4 py-2.5">Cenário {c}</th>)}
              </tr>
            </thead>
            <tbody>
              {MARCOS.map((n) => (
                <tr key={n} className="border-t border-[#E6E2D8]">
                  <td className="px-4 py-2.5 font-medium text-[#00704A]">{n}</td>
                  {LISTA.map((c) => {
                    const p = comPrecos(premissas, cenarios[c]);
                    const e = ebitdaPct(p, n);
                    return (
                      <td key={c} className="px-4 py-2.5 text-center">
                        <span className={`font-bold ${corEbitda(e)}`}>{pct(e)}</span>
                        <span className="block text-[10px] text-gray-400">{fmt(ebitda(p, n))}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Retirada do Enzo por cenário */}
      <div className="bg-white border border-[#E6E2D8] rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-[#E6E2D8] bg-[#F2F0EB]">
          <span className="text-sm font-bold text-[#00704A]">Retirada do Enzo ({pct(premissas.pctEnzo)}) por cenário</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#FAFAF9] text-[10px] text-gray-400 uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-2.5">Clientes</th>
                {LISTA.map((c) => <th key={c} className="text-center px-4 py-2.5">Cenário {c}</th>)}
              </tr>
            </thead>
            <tbody>
              {MARCOS.map((n) => (
                <tr key={n} className="border-t border-[#E6E2D8]">
                  <td className="px-4 py-2.5 font-medium text-[#00704A]">{n}</td>
                  {LISTA.map((c) => {
                    const p = comPrecos(premissas, cenarios[c]);
                    const v = lucroDisponivel(p, n) > 0 ? retiradaSocio(p, n, premissas.pctEnzo) : 0;
                    return (
                      <td key={c} className="px-4 py-2.5 text-center text-gray-600">
                        {v > 0 ? fmt(v) : "—"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
