import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

// Cabeçalho padrão dos submódulos de Tecnologia, com volta para a home.
export default function TecBreadcrumb({ title, subtitle }) {
  const navigate = useNavigate();
  return (
    <div className="mb-6">
      <button
        onClick={() => navigate("/tecnologia")}
        className="text-xs text-gray-400 hover:text-[#00704A] flex items-center gap-1 mb-1 transition"
      >
        <ChevronLeft size={13} /> Tecnologia
      </button>
      <h1 className="text-xl font-black text-[#00704A]">{title}</h1>
      {subtitle && <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
  );
}
