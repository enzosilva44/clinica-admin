import { useEffect, useState } from "react";
import { Archive, Save, Trash2, FolderOpen, Calendar, User } from "lucide-react";
import adminApi from "../../services/api";
import toast from "react-hot-toast";

function fmtData(d) {
  return new Date(d).toLocaleString("pt-BR", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function EstimativasSalvas({ premissas, onCarregar }) {
  const [estimativas, setEstimativas] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [titulo, setTitulo]     = useState("");
  const [showForm, setShowForm] = useState(false);

  async function carregar() {
    setLoading(true);
    try {
      const res = await adminApi.get("/admin/financial/estimates");
      setEstimativas(res.data);
    } catch { toast.error("Erro ao carregar estimativas"); }
    finally { setLoading(false); }
  }

  useEffect(() => { carregar(); }, []);

  async function salvar() {
    if (!titulo.trim()) return toast.error("Dê um nome para a estimativa.");
    setSalvando(true);
    try {
      const res = await adminApi.post("/admin/financial/estimates", {
        title: titulo.trim(),
        premissas,
      });
      setEstimativas((e) => [res.data, ...e]);
      setTitulo("");
      setShowForm(false);
      toast.success("Estimativa salva!");
    } catch (err) { toast.error(err.response?.data?.error ?? "Erro ao salvar."); }
    finally { setSalvando(false); }
  }

  async function remover(id) {
    if (!confirm("Remover esta estimativa salva?")) return;
    try {
      await adminApi.delete(`/admin/financial/estimates/${id}`);
      setEstimativas((e) => e.filter((x) => x.id !== id));
    } catch { toast.error("Erro ao remover."); }
  }

  return (
    <div className="bg-white border border-[#E6E2D8] rounded-2xl overflow-hidden">
      <div className="px-5 py-3 border-b border-[#E6E2D8] bg-[#F2F0EB] flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-bold text-[#00704A]">
          <Archive size={15} /> Estimativas salvas
          {estimativas.length > 0 && (
            <span className="text-xs font-normal text-gray-400">({estimativas.length})</span>
          )}
        </span>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 bg-[#00704A] hover:bg-[#1E3932] text-white px-3 py-1.5 rounded-lg text-xs font-medium transition"
        >
          <Save size={12} /> Salvar atual
        </button>
      </div>

      <div className="p-5">
        {/* Form de salvar */}
        {showForm && (
          <div className="flex gap-2 mb-4">
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && salvar()}
              placeholder="Nome da estimativa (ex: Cenário conservador jun/26)"
              autoFocus
              className="flex-1 border border-[#DDD8CC] rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-[#00704A]"
            />
            <button onClick={salvar} disabled={salvando}
              className="bg-[#00704A] hover:bg-[#1E3932] disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-medium transition">
              {salvando ? "Salvando…" : "Salvar"}
            </button>
            <button onClick={() => { setShowForm(false); setTitulo(""); }}
              className="px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded-xl transition">
              Cancelar
            </button>
          </div>
        )}

        {/* Lista */}
        {loading ? (
          <p className="text-sm text-gray-400 text-center py-6">Carregando…</p>
        ) : estimativas.length === 0 ? (
          <div className="text-center py-8">
            <Archive size={28} className="text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Nenhuma estimativa salva ainda.</p>
            <p className="text-xs text-gray-400 mt-1">Ajuste as premissas e clique em "Salvar atual" para registrar.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {estimativas.map((est) => (
              <div key={est.id} className="flex items-center justify-between gap-3 bg-[#F2F0EB] border border-[#E6E2D8] rounded-xl px-4 py-3 group">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#00704A] truncate">{est.title}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="flex items-center gap-1 text-[10px] text-gray-400">
                      <Calendar size={10} /> {fmtData(est.createdAt)}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-gray-400">
                      <User size={10} /> {est.author}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => { onCarregar(est.premissas); toast.success(`"${est.title}" carregada`); }}
                    title="Carregar estas premissas"
                    className="flex items-center gap-1 text-xs border border-[#00704A]/30 text-[#00704A] hover:bg-[#F0F7F5] px-2.5 py-1.5 rounded-lg transition"
                  >
                    <FolderOpen size={12} /> Carregar
                  </button>
                  <button
                    onClick={() => remover(est.id)}
                    title="Remover"
                    className="opacity-0 group-hover:opacity-100 w-7 h-7 bg-red-50 hover:bg-red-100 border border-red-100 text-red-400 rounded-lg flex items-center justify-center transition"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
