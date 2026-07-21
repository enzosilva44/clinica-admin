import { Check, Minus } from "lucide-react";
import AdminLayout from "../../components/AdminLayout";
import SecaoInfo from "../../components/SecaoInfo";
import TecBreadcrumb from "./TecBreadcrumb";
import { getFeatures } from "../../config/features";

const PLANS = [
  { key: "solo",       label: "Solo" },
  { key: "clinica",    label: "Clínica" },
  { key: "enterprise", label: "Enterprise" },
  { key: "dev",        label: "Dev" },
];

const FEATURE_LABELS = {
  agenda:            "Agenda",
  patients:          "Pacientes",
  procedureMap:      "Mapa de Procedimentos",
  documents:         "Documentos",
  portfolio:         "Portfólio",
  signatures:        "Assinatura Eletrônica",
  financial:         "Financeiro",
  faturamento:       "Faturamento (Asaas)",
  stock:             "Estoque & Produtos",
  analytics:         "Analytics",
  whatsapp:          "Automações WhatsApp",
  aiSummary:         "IA — Resumo de Paciente",
  aiAssistant:       "IA — Assistente",
  clube:             "Clube de Fidelidade",
  multiProfessional: "Multi-profissional",
};

export default function FeaturesPlanos() {
  const matrix = PLANS.reduce((acc, p) => { acc[p.key] = getFeatures(p.key); return acc; }, {});

  return (
    <AdminLayout>
      <TecBreadcrumb title="Features / Planos" subtitle="Funcionalidades liberadas por padrão em cada plano." />

      <SecaoInfo titulo="Como funciona" itens={[
        { nome: "Padrão do plano", desc: "Esta é a matriz base: o que cada plano libera automaticamente ao ser contratado." },
        { nome: "Sobrescrever por clínica", desc: "Para uma clínica específica, use Tecnologia → Clínicas e expanda a clínica para ligar/desligar features individualmente." },
      ]} />

      <div className="bg-white rounded-2xl border border-[#E6E2D8] overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[560px]">
          <thead className="bg-[#F2F0EB] text-xs text-gray-500 uppercase tracking-wide">
            <tr>
              <th className="text-left px-5 py-3">Funcionalidade</th>
              {PLANS.map((p) => (
                <th key={p.key} className="text-center px-4 py-3">{p.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(FEATURE_LABELS).map(([key, label]) => (
              <tr key={key} className="border-t border-[#E6E2D8]">
                <td className="px-5 py-3 font-medium text-gray-700">{label}</td>
                {PLANS.map((p) => {
                  const on = matrix[p.key]?.[key];
                  return (
                    <td key={p.key} className="px-4 py-3 text-center">
                      {on ? (
                        <span className="inline-flex w-6 h-6 rounded-lg bg-[#F0F7F5] items-center justify-center">
                          <Check size={14} className="text-[#00704A]" />
                        </span>
                      ) : (
                        <span className="inline-flex w-6 h-6 rounded-lg bg-gray-50 items-center justify-center">
                          <Minus size={14} className="text-gray-300" />
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
