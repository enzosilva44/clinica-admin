import { useState } from "react";
import { ticketMinimo, ticketMedio, lucroDisponivel, retiradaSocio } from "./calculadora";

const fmt = (n) => isFinite(n) ? `R$ ${Math.round(n).toLocaleString("pt-BR")}` : "—";

export default function CalculadoraTab({ premissas: p }) {
  const [margem, setMargem] = useState(30); // %
  const [n, setN] = useState(100);

  const margemFrac = margem / 100;
  const ticketMin = ticketMinimo(p, margemFrac, n);

  // Comparação com os planos atuais
  const planos = [
    { nome: "Solo", preco: p.precoSolo },
    { nome: "Clínica", preco: p.precoClinica },
    { nome: "Pro", preco: p.precoPro },
  ];

  // Retirada do Enzo se aplicasse esse ticket mínimo como ticket médio
  // (aproximação: simula premissas com todos os preços iguais ao ticket mínimo)
  const pSimulado = isFinite(ticketMin)
    ? { ...p, precoSolo: ticketMin, precoClinica: ticketMin, precoPro: ticketMin }
    : p;
  const retiradaEnzo = isFinite(ticketMin) && lucroDisponivel(pSimulado, n) > 0
    ? retiradaSocio(pSimulado, n, p.pctEnzo) : 0;

  // Dados do gráfico: ticket mínimo de 10 a 500 clientes para a margem atual
  const pontos = [];
  for (let c = 10; c <= 500; c += 10) {
    const t = ticketMinimo(p, margemFrac, c);
    pontos.push({ c, t: isFinite(t) ? t : null });
  }
  const validos = pontos.filter((x) => x.t !== null);
  const maxT = Math.max(...validos.map((x) => x.t), 1);
  const minT = Math.min(...validos.map((x) => x.t), 0);

  // SVG dims
  const W = 600, H = 220, padL = 50, padB = 28, padT = 12, padR = 12;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const x = (c) => padL + ((c - 10) / (500 - 10)) * plotW;
  const y = (t) => padT + plotH - ((t - minT) / (maxT - minT || 1)) * plotH;
  const path = validos.map((pt, i) => `${i === 0 ? "M" : "L"} ${x(pt.c).toFixed(1)} ${y(pt.t).toFixed(1)}`).join(" ");

  return (
    <div className="space-y-4">
      {/* Controles */}
      <div className="bg-white border border-[#E6E2D8] rounded-2xl p-5 space-y-5">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-[#00704A]">Margem EBITDA desejada</label>
            <span className="text-sm font-bold text-[#00704A]">{margem}%</span>
          </div>
          <input type="range" min="0" max="60" step="1" value={margem}
            onChange={(e) => setMargem(Number(e.target.value))}
            className="w-full accent-[#00704A]" />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-[#00704A]">Número de clientes</label>
            <span className="text-sm font-bold text-[#00704A]">{n}</span>
          </div>
          <input type="range" min="10" max="500" step="5" value={n}
            onChange={(e) => setN(Number(e.target.value))}
            className="w-full accent-[#00704A]" />
        </div>
      </div>

      {/* Resultado em destaque */}
      <div className="bg-[#00704A] rounded-2xl p-6 text-center">
        <p className="text-xs font-semibold text-white/60 uppercase tracking-widest mb-2">
          Ticket médio mínimo necessário
        </p>
        <p className="text-4xl font-black text-white">{fmt(ticketMin)}</p>
        <p className="text-xs text-white/50 mt-2">
          para margem EBITDA de {margem}% com {n} clientes
        </p>
        {isFinite(ticketMin) && (
          <p className="text-sm text-[#CBA258] mt-3 font-medium">
            Com este ticket, a retirada do Enzo seria {fmt(retiradaEnzo)}/mês
          </p>
        )}
      </div>

      {/* Comparação com planos atuais */}
      <div className="bg-white border border-[#E6E2D8] rounded-2xl p-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Comparação com os preços atuais (ticket médio atual: {fmt(ticketMedio(p))})
        </p>
        <div className="grid grid-cols-3 gap-3">
          {planos.map((pl) => {
            const acima = isFinite(ticketMin) && ticketMin > pl.preco;
            return (
              <div key={pl.nome} className="border border-[#E6E2D8] rounded-xl p-3 text-center">
                <p className="text-xs text-gray-400">{pl.nome}</p>
                <p className="text-lg font-black text-[#00704A]">{fmt(pl.preco)}</p>
                {isFinite(ticketMin) && (
                  <p className={`text-[10px] mt-1 font-medium ${acima ? "text-red-500" : "text-green-600"}`}>
                    {acima ? "abaixo do mínimo" : "acima do mínimo ✓"}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Gráfico SVG: ticket mínimo × clientes */}
      <div className="bg-white border border-[#E6E2D8] rounded-2xl p-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Ticket mínimo conforme a base cresce (margem {margem}%)
        </p>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 240 }}>
          {/* eixos */}
          <line x1={padL} y1={padT} x2={padL} y2={padT + plotH} stroke="#DDD8CC" strokeWidth="1" />
          <line x1={padL} y1={padT + plotH} x2={padL + plotW} y2={padT + plotH} stroke="#DDD8CC" strokeWidth="1" />
          {/* labels eixo Y (min e max) */}
          <text x={padL - 6} y={padT + 4} textAnchor="end" fontSize="9" fill="#9ca3af">{fmt(maxT)}</text>
          <text x={padL - 6} y={padT + plotH} textAnchor="end" fontSize="9" fill="#9ca3af">{fmt(minT)}</text>
          {/* labels eixo X */}
          {[10, 100, 250, 500].map((c) => (
            <text key={c} x={x(c)} y={padT + plotH + 16} textAnchor="middle" fontSize="9" fill="#9ca3af">{c}</text>
          ))}
          {/* linha */}
          <path d={path} fill="none" stroke="#00704A" strokeWidth="2.5" strokeLinejoin="round" />
          {/* ponto do n selecionado */}
          {isFinite(ticketMin) && (
            <circle cx={x(n)} cy={y(ticketMin)} r="4" fill="#CBA258" stroke="white" strokeWidth="2" />
          )}
        </svg>
        <p className="text-[10px] text-gray-400 text-center mt-1">
          Quanto mais clientes, menor o ticket necessário (os custos fixos se diluem)
        </p>
      </div>
    </div>
  );
}
