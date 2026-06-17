import { useState } from "react";
import { Info, ChevronDown } from "lucide-react";

// Caixa expansível que explica o que a aba/seção faz e suas funcionalidades.
// Uso: <SecaoInfo titulo="..." itens={[{ nome, desc }, ...]} />
export default function SecaoInfo({ titulo = "O que dá para fazer aqui?", itens = [] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white border border-[#E6E2D8] rounded-2xl overflow-hidden mb-5">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3 hover:bg-[#F2F0EB] transition"
      >
        <span className="flex items-center gap-2 text-sm font-bold text-[#00704A]">
          <Info size={15} /> {titulo}
        </span>
        <ChevronDown size={16} className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="px-5 pb-4 pt-1 border-t border-[#E6E2D8]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            {itens.map((it) => (
              <div key={it.nome} className="bg-[#F2F0EB] border border-[#E6E2D8] rounded-xl p-3">
                <p className="text-sm font-semibold text-[#1C1C1C] mb-0.5">{it.nome}</p>
                <p className="text-xs text-gray-600 leading-relaxed">{it.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
