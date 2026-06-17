import { useState } from "react";
import { Wallet, TrendingUp, Lock, Users } from "lucide-react";
import {
  ebitda, caixaMinimo, lucroDisponivel, ficaNaEmpresa, retiradaSocio,
} from "./calculadora";

const fmt = (n) => `R$ ${Math.round(n).toLocaleString("pt-BR")}`;

const SOCIOS = [
  { key: "pctEnzo",      nome: "Enzo",       cor: "#00704A" },
  { key: "pctAnaFlavia", nome: "Ana Flávia", cor: "#CBA258" },
  { key: "pctGean",      nome: "Gean",       cor: "#4A8EC2" },
  { key: "pctEuriane",   nome: "Euriane",    cor: "#9B59B6" },
];

export default function DistribuicaoSocios({ premissas: p }) {
  const [n, setN] = useState(100);

  const ebit       = ebitda(p, n);
  const caixa      = caixaMinimo(p, n);
  const provisao   = caixa * p.provisaoTributaria;
  const disponivel = lucroDisponivel(p, n);
  const retido     = ficaNaEmpresa(p, n);
  const prejuizo   = ebit < 0;  // EBITDA negativo → operação dá prejuízo

  return (
    <div className="bg-white border border-[#E6E2D8] rounded-2xl overflow-hidden">
      <div className="px-5 py-3 border-b border-[#E6E2D8] bg-[#F2F0EB] flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-bold text-[#00704A]">
          <Users size={15} /> Distribuição entre Sócios
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Clientes:</span>
          <span className="text-sm font-bold text-[#00704A] w-10 text-right">{n}</span>
        </div>
      </div>

      <div className="p-5">
        {/* Slider de clientes */}
        <input
          type="range" min="10" max="500" step="5" value={n}
          onChange={(e) => setN(Number(e.target.value))}
          className="w-full accent-[#00704A] mb-5"
        />

        {/* Cascata: EBITDA → caixa/provisão → disponível */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <div className="bg-[#F0F7F5] border border-[#00704A]/15 rounded-xl p-3">
            <p className="flex items-center gap-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
              <TrendingUp size={11} /> EBITDA
            </p>
            <p className="text-lg font-black text-[#00704A]">{ebit > 0 ? fmt(ebit) : "—"}</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 uppercase tracking-wide mb-1">
              <Lock size={11} /> Caixa mínimo
            </p>
            <p className="text-lg font-black text-amber-600">{fmt(caixa)}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">reserva obrigatória</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 uppercase tracking-wide mb-1">
              <Lock size={11} /> Provisão tributária
            </p>
            <p className="text-lg font-black text-amber-600">{fmt(provisao)}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{(p.provisaoTributaria * 100).toFixed(0)}% sobre caixa</p>
          </div>
          {prejuizo ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="flex items-center gap-1 text-[10px] font-semibold text-red-600 uppercase tracking-wide mb-1">
                <Wallet size={11} /> Prejuízo total
              </p>
              <p className="text-lg font-black text-red-600">({fmt(Math.abs(ebit))})</p>
              <p className="text-[10px] text-gray-400 mt-0.5">a cobrir pelos sócios</p>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3">
              <p className="flex items-center gap-1 text-[10px] font-semibold text-green-700 uppercase tracking-wide mb-1">
                <Wallet size={11} /> Disponível total
              </p>
              <p className="text-lg font-black text-green-700">{disponivel > 0 ? fmt(disponivel) : "—"}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">p/ distribuição</p>
            </div>
          )}
        </div>

        {/* Retido na empresa (só quando há lucro) */}
        {!prejuizo && (
          <div className="flex items-center justify-between bg-[#F2F0EB] border border-[#E6E2D8] rounded-xl px-4 py-2.5 mb-5">
            <span className="text-xs text-gray-500">
              Total que <strong className="text-[#00704A]">fica na empresa</strong> (caixa + provisão)
            </span>
            <span className="text-sm font-bold text-gray-600">{fmt(retido)}</span>
          </div>
        )}

        {/* Cards dos sócios */}
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">
          {prejuizo
            ? "Prejuízo por sócio (proporção da participação)"
            : "Retirada por sócio (já descontados caixa e provisão)"}
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {SOCIOS.map((s) => {
            const valor = prejuizo
              ? ebit * p[s.key]                                    // fatia negativa do prejuízo
              : (disponivel > 0 ? retiradaSocio(p, n, p[s.key]) : 0);
            return (
              <div key={s.key} className="border border-[#E6E2D8] rounded-xl p-3" style={{ borderTopColor: s.cor, borderTopWidth: 3 }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-[#00704A]">{s.nome}</span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: s.cor }}>
                    {(p[s.key] * 100).toFixed(0)}%
                  </span>
                </div>
                <p className={`text-lg font-black ${valor < 0 ? "text-red-600" : "text-[#00704A]"}`}>
                  {valor < 0 ? `(${fmt(Math.abs(valor))})` : valor > 0 ? fmt(valor) : "—"}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  /mês · {valor !== 0 ? `${valor < 0 ? "(" : ""}${fmt(Math.abs(valor * 12))}${valor < 0 ? ")" : ""}` : "—"}/ano
                </p>
              </div>
            );
          })}
        </div>

        {/* Reserva (sócio fictício 10%) — só quando há lucro */}
        {p.pctReserva > 0 && !prejuizo && (
          <div className="mt-3 flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
            <span className="text-xs text-gray-500">
              <strong className="text-gray-700">Reserva</strong> ({(p.pctReserva * 100).toFixed(0)}% do disponível)
            </span>
            <span className="text-sm font-bold text-gray-600">
              {disponivel > 0 ? fmt(retiradaSocio(p, n, p.pctReserva)) : "—"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
