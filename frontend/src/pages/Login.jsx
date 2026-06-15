import { useState } from "react";
import { Eye, EyeOff, Shield } from "lucide-react";
import toast from "react-hot-toast";
import { useAdminAuth } from "../contexts/AdminAuthContext";

const INPUT = "w-full border border-[#D8CDB9] bg-[#FDFCFA] rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1F4D46]/20 focus:border-[#1F4D46] transition";

export default function Login() {
  const { adminLogin } = useAdminAuth();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await adminLogin(email.trim().toLowerCase(), password);
    } catch (err) {
      toast.error(err.message ?? "E-mail ou senha inválidos");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#1F4D46] flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl px-8 py-10">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-2xl bg-[#1F4D46] flex items-center justify-center">
            <Shield size={20} className="text-[#C2A56B]" />
          </div>
          <div>
            <p className="text-lg font-bold text-[#1F4D46]">
              Iaso<span className="text-[#C2A56B]">Clin</span>
            </p>
            <p className="text-[11px] text-gray-400 -mt-0.5">Painel Administrativo</p>
          </div>
        </div>

        <h2 className="text-xl font-bold text-[#1F4D46] mb-1">Acesso restrito</h2>
        <p className="text-xs text-gray-400 mb-7">Apenas administradores do sistema.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">E-mail</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@email.com" autoCapitalize="none" inputMode="email" required className={INPUT} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Senha</label>
            <div className="relative">
              <input type={showPass ? "text" : "password"} value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" required className={INPUT + " pr-11"} />
              <button type="button" onClick={() => setShowPass((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-[#1F4D46] hover:bg-[#285A50] disabled:opacity-60 text-white py-3 rounded-xl font-semibold text-sm transition mt-2">
            {loading ? "Entrando…" : "Entrar no painel"}
          </button>
        </form>
      </div>
    </div>
  );
}
