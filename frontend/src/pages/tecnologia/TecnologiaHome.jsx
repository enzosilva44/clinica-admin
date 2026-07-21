import { useNavigate } from "react-router-dom";
import { Building2, Activity, SlidersHorizontal, ScrollText, Cloud, ChevronRight } from "lucide-react";
import AdminLayout from "../../components/AdminLayout";

const MODULES = [
  {
    to: "/tecnologia/clinicas",
    icon: Building2,
    title: "Clínicas",
    desc: "Gestão das clínicas cadastradas: planos, features, criação e exclusão.",
    color: "#00704A",
  },
  {
    to: "/tecnologia/saude",
    icon: Activity,
    title: "Saúde do Sistema",
    desc: "Status de servidor e banco, latência e uptime da plataforma.",
    color: "#0EA5E9",
  },
  {
    to: "/tecnologia/features",
    icon: SlidersHorizontal,
    title: "Features / Planos",
    desc: "Funcionalidades liberadas por padrão em cada plano.",
    color: "#7C3AED",
  },
  {
    to: "/tecnologia/logs",
    icon: ScrollText,
    title: "Logs / Auditoria",
    desc: "Histórico de ações do admin: exclusões, trocas de plano e mais.",
    color: "#CBA258",
  },
  {
    to: "/tecnologia/infra",
    icon: Cloud,
    title: "Infraestrutura",
    desc: "Custo estimado atual da AWS (EC2, banco, storage) e recursos em uso.",
    color: "#F97316",
  },
];

export default function TecnologiaHome() {
  const navigate = useNavigate();

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-xl font-black text-[#00704A]">Tecnologia</h1>
        <p className="text-sm text-gray-400 mt-0.5">Selecione um submódulo para gerenciar.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {MODULES.map(({ to, icon: Icon, title, desc, color }) => (
          <button
            key={to}
            onClick={() => navigate(to)}
            className="group text-left bg-white rounded-2xl p-5 border border-[#E6E2D8] hover:border-[#00704A]/40 hover:shadow-sm transition flex items-start gap-4"
          >
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}18` }}>
              <Icon size={20} style={{ color }} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <h2 className="text-base font-bold text-[#00704A]">{title}</h2>
                <ChevronRight size={16} className="text-gray-300 group-hover:text-[#00704A] group-hover:translate-x-0.5 transition" />
              </div>
              <p className="text-sm text-gray-400 mt-0.5 leading-snug">{desc}</p>
            </div>
          </button>
        ))}
      </div>
    </AdminLayout>
  );
}
