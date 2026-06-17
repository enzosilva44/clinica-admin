import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import AdminLayout from "../../components/AdminLayout";
import SecaoInfo from "../../components/SecaoInfo";
import PremissasPanel from "./PremissasPanel";
import Glossario from "./Glossario";
import DistribuicaoSocios from "./DistribuicaoSocios";
import EstimativasSalvas from "./EstimativasSalvas";
import SimuladorTab from "./SimuladorTab";
import CalculadoraTab from "./CalculadoraTab";
import {
  PREMISSAS_PADRAO, MILESTONES,
  ticketMedio, totalCustosFixos, receitaTotal, ebitda, ebitdaPct,
  lucroDisponivel, milestoneBreakEven,
} from "./calculadora";

const fmt = (n) => `R$ ${Math.round(n).toLocaleString("pt-BR")}`;
const pct = (n) => `${(n * 100).toFixed(1)}%`;
const STORAGE_KEY = "iaso_planejamento_premissas";

function loadPremissas() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...PREMISSAS_PADRAO, ...JSON.parse(raw) } : { ...PREMISSAS_PADRAO };
  } catch { return { ...PREMISSAS_PADRAO }; }
}

// Página PROVISÓRIA só para validar o painel de premissas + cálculos ao vivo.
export default function PlanejamentoSandbox() {
  const [premissas, setPremissas] = useState(loadPremissas);
  const [salvo, setSalvo] = useState(loadPremissas);

  const dirty = JSON.stringify(premissas) !== JSON.stringify(salvo);

  function onSave() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(premissas));
    setSalvo(premissas);
  }

  const breakEven = useMemo(() => milestoneBreakEven(premissas), [premissas]);
  const navigate = useNavigate();
  const [tab, setTab] = useState("projecao");

  const TABS = [
    { id: "projecao",    label: "Projeção" },
    { id: "simulador",   label: "Simulador" },
    { id: "socios",      label: "Sócios" },
    { id: "calculadora", label: "Calculadora" },
  ];

  return (
    <AdminLayout>
      <button
        onClick={() => navigate("/financial")}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#00704A] transition mb-3"
      >
        <ArrowLeft size={13} /> Voltar ao Financeiro
      </button>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-[#00704A]">Planejamento Financeiro</h1>
        <p className="text-gray-400 text-sm mt-0.5">
          Simule premissas e veja receita, EBITDA e distribuição entre sócios recalcularem ao vivo
        </p>
      </div>

      <div className="mb-4">
        <Glossario />
      </div>

      <SecaoInfo titulo="Como usar o Planejamento Financeiro" itens={[
        { nome: "Painel de Premissas (esquerda)", desc: "Edite preços, custos, % dos sócios e política de caixa. Tudo recalcula na hora. Some 100% no mix de planos e na divisão de sócios (avisa se não bater)." },
        { nome: "Salvar premissas", desc: "Clique em 'Salvar' no topo do painel para gravar os valores atuais (o ponto amarelo indica alterações não salvas)." },
        { nome: "Aba Projeção", desc: "Tabela de 25 a 500 clientes mostrando receita, EBITDA, % de margem e quanto sobra para distribuir. O break-even aparece destacado em azul." },
        { nome: "Aba Simulador", desc: "Compare 3 cenários de preço (A/B/C) lado a lado — veja como cada estratégia muda a margem e a retirada do Enzo." },
        { nome: "Aba Sócios", desc: "Arraste o slider de clientes e veja a cascata: EBITDA → caixa retido → disponível → quanto cada sócio recebe. Em prejuízo, mostra a divisão da perda." },
        { nome: "Aba Calculadora", desc: "Defina a margem desejada e o nº de clientes; ela calcula o ticket mínimo necessário e mostra num gráfico como ele cai conforme a base cresce." },
        { nome: "Estimativas salvas", desc: "Salve um cenário com nome (ex: 'Conservador jun/26'). Fica registrado com data e autor, e qualquer sócio pode recarregar depois." },
      ]} />

      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* Painel de premissas */}
        <PremissasPanel premissas={premissas} setPremissas={setPremissas} onSave={onSave} dirty={dirty} />

        {/* Painel direito */}
        <div className="flex-1 min-w-0 w-full space-y-4">
          {/* KPIs base (sempre visíveis) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Ticket médio", value: fmt(ticketMedio(premissas)) },
              { label: "Custos fixos/mês", value: fmt(totalCustosFixos(premissas)) },
              { label: "Break-even", value: breakEven ? `${breakEven} clientes` : "—" },
              { label: "Status", value: dirty ? "Não salvo" : "Salvo", warn: dirty },
            ].map(({ label, value, warn }) => (
              <div key={label} className="bg-white border border-[#E6E2D8] rounded-2xl p-4">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                <p className={`text-lg font-black ${warn ? "text-amber-500" : "text-[#00704A]"}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Barra de sub-abas */}
          <div className="flex gap-1 bg-[#F2F0EB] border border-[#DDD8CC] rounded-xl p-1 w-fit">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  tab === t.id ? "bg-[#00704A] text-white" : "text-gray-500 hover:text-[#00704A]"
                }`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Conteúdo da aba ativa */}
          {tab === "projecao" && (
            <div className="bg-white border border-[#E6E2D8] rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-[#E6E2D8] bg-[#F2F0EB]">
                <span className="text-sm font-bold text-[#00704A]">Projeção (recalcula ao editar)</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[#FAFAF9] text-[10px] text-gray-400 uppercase tracking-wide">
                    <tr>
                      <th className="text-left px-4 py-2.5">Clientes</th>
                      <th className="text-right px-4 py-2.5">Receita</th>
                      <th className="text-right px-4 py-2.5">EBITDA</th>
                      <th className="text-center px-4 py-2.5">% EBITDA</th>
                      <th className="text-right px-4 py-2.5">Disponível</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MILESTONES.map((n) => {
                      const e = ebitdaPct(premissas, n);
                      const cor = e >= 0.2 ? "text-green-600" : e >= 0 ? "text-amber-500" : "text-red-500";
                      const disp = lucroDisponivel(premissas, n);
                      return (
                        <tr key={n} className={`border-t border-[#E6E2D8] ${n === breakEven ? "bg-blue-50/40" : ""}`}>
                          <td className="px-4 py-2.5 font-medium text-[#00704A]">{n}</td>
                          <td className="px-4 py-2.5 text-right text-gray-600">{fmt(receitaTotal(premissas, n))}</td>
                          <td className="px-4 py-2.5 text-right font-semibold text-[#00704A]">{fmt(ebitda(premissas, n))}</td>
                          <td className={`px-4 py-2.5 text-center font-bold ${cor}`}>{pct(e)}</td>
                          <td className="px-4 py-2.5 text-right text-gray-600">{disp > 0 ? fmt(disp) : "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "simulador"   && <SimuladorTab premissas={premissas} />}
          {tab === "socios"      && <DistribuicaoSocios premissas={premissas} />}
          {tab === "calculadora" && <CalculadoraTab premissas={premissas} />}

          {/* Estimativas salvas — comum a todas as abas */}
          <EstimativasSalvas
            premissas={premissas}
            onCarregar={(p) => setPremissas({ ...PREMISSAS_PADRAO, ...p })}
          />
        </div>
      </div>
    </AdminLayout>
  );
}
