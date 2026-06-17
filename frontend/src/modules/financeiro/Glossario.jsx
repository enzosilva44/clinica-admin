import { useState } from "react";
import { ChevronDown, BookOpen } from "lucide-react";

const TERMOS = [
  {
    sigla: "MRR",
    nome: "Monthly Recurring Revenue",
    desc: "Receita Recorrente Mensal. A soma das assinaturas que entram todo mês de forma previsível. É a base do faturamento de um SaaS — quanto a empresa fatura por mês só com os planos ativos.",
  },
  {
    sigla: "ARR",
    nome: "Annual Recurring Revenue",
    desc: "Receita Recorrente Anual. É o MRR multiplicado por 12 — a projeção de quanto a empresa fatura no ano mantendo a base atual de clientes.",
  },
  {
    sigla: "EBITDA",
    nome: "Earnings Before Interest, Taxes, Depreciation and Amortization",
    desc: "Lucro antes de juros, impostos, depreciação e amortização. Na prática: a receita total menos todos os custos operacionais (fixos e variáveis). Mostra quanto a operação gera de caixa antes de impostos e distribuições. É o indicador-chave de saúde do negócio.",
  },
  {
    sigla: "% Margem EBITDA",
    nome: "Margem operacional",
    desc: "Quanto do que entra vira lucro operacional. Ex: 40% significa que de cada R$100 de receita, R$40 sobram como EBITDA. Acima de 20% é saudável para um SaaS.",
  },
  {
    sigla: "Margem Bruta",
    nome: "Receita menos custos variáveis",
    desc: "O que sobra da receita depois de pagar só os custos que escalam com cada cliente (gateway, IA, suporte). Ainda não desconta os custos fixos. Mostra a eficiência por cliente.",
  },
  {
    sigla: "Ticket Médio",
    nome: "Receita média por cliente",
    desc: "O valor médio que cada cliente paga por mês, considerando a proporção (mix) entre os planos Solo, Clínica e Pro. Ex: se metade paga R$79 e metade R$197, o ticket médio fica no meio.",
  },
  {
    sigla: "Break-even",
    nome: "Ponto de equilíbrio",
    desc: "O número de clientes a partir do qual a empresa para de dar prejuízo e começa a ter EBITDA positivo. Antes dele, a operação custa mais do que arrecada.",
  },
  {
    sigla: "Custos Fixos",
    nome: "Despesas que não mudam com o nº de clientes",
    desc: "Gastos que a empresa paga independente de ter 10 ou 500 clientes: infraestrutura AWS, contador, jurídico, marketing. Diluem-se conforme a base cresce.",
  },
  {
    sigla: "Custos Variáveis",
    nome: "Despesas que escalam por cliente",
    desc: "Gastos que crescem proporcionalmente: taxa do gateway de pagamento, tokens de IA, assinatura digital e suporte. Cada cliente novo soma um pouco aqui.",
  },
  {
    sigla: "Rev Share Asaas",
    nome: "Revenue Share (divisão de receita)",
    desc: "Comissão que a Iasoclin recebe sobre transações de pagamento processadas pelos clientes via Asaas. É receita extra ao MRR — mas depende da adesão ativa dos clientes, por isso é calculada de forma conservadora.",
  },
  {
    sigla: "Caixa Mínimo",
    nome: "Reserva obrigatória",
    desc: "O valor que a empresa retém antes de distribuir lucro: um múltiplo dos custos fixos + uma reserva para absorver churn. Garante fôlego financeiro mesmo em meses ruins.",
  },
  {
    sigla: "Churn",
    nome: "Taxa de cancelamento",
    desc: "Proporção de clientes que cancelam a assinatura num período. O 'churn buffer' é uma reserva da receita para absorver essas perdas sem comprometer a operação.",
  },
  {
    sigla: "Provisão Tributária",
    nome: "Reserva para impostos",
    desc: "Percentual separado antes da distribuição para cobrir os impostos incidentes sobre o lucro distribuído aos sócios.",
  },
  {
    sigla: "Lucro Disponível",
    nome: "Disponível para distribuição",
    desc: "O que efetivamente sobra para dividir entre os sócios, depois de descontar custos, reservar o caixa mínimo e a provisão tributária. É de onde sai a retirada de cada um.",
  },
];

export default function Glossario() {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white border border-[#E6E2D8] rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3 hover:bg-[#F2F0EB] transition"
      >
        <span className="flex items-center gap-2 text-sm font-bold text-[#00704A]">
          <BookOpen size={15} /> O que significam as siglas?
        </span>
        <ChevronDown size={16} className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="px-5 pb-4 pt-1 border-t border-[#E6E2D8]">
          <p className="text-xs text-gray-400 mb-3 mt-2">
            Glossário rápido dos termos financeiros usados neste módulo.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {TERMOS.map((t) => (
              <div key={t.sigla} className="bg-[#F2F0EB] border border-[#E6E2D8] rounded-xl p-3">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-sm font-bold text-[#00704A]">{t.sigla}</span>
                  <span className="text-[10px] text-gray-400 italic truncate">{t.nome}</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
