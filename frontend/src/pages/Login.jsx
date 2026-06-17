import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { useAdminAuth } from "../contexts/AdminAuthContext";

const INPUT = "w-full border border-[#DDD8CC] bg-[#F2F0EB] rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#00704A]/20 focus:border-[#00704A] transition";

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
    <div className="min-h-screen bg-[#00704A] flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl px-8 py-10">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <svg viewBox="0 0 56 80" fill="none" className="w-6 h-8">
            <line x1="14" y1="7"  x2="42" y2="7"  stroke="#CBA258" strokeWidth="4" strokeLinecap="round" />
            <line x1="28" y1="7"  x2="28" y2="73" stroke="#CBA258" strokeWidth="4" strokeLinecap="round" />
            <line x1="14" y1="73" x2="42" y2="73" stroke="#CBA258" strokeWidth="4" strokeLinecap="round" />
            <path d="M28 32 Q40 14 44 12 Q46 22 38 28 Q34 31 28 32 Z" fill="#CBA258" opacity="0.85" />
          </svg>
          <div>
            <p className="text-lg font-bold">
              <span className="text-[#00704A]">Iaso</span><span className="text-[#CBA258]">clin</span>
            </p>
            <p className="text-[11px] text-gray-400 -mt-0.5">Painel Administrativo</p>
          </div>
        </div>

        <h2 className="text-xl font-bold text-[#00704A] mb-1">Acesso restrito</h2>
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
            className="w-full bg-[#00704A] hover:bg-[#1E3932] disabled:opacity-60 text-white py-3 rounded-xl font-semibold text-sm transition mt-2">
            {loading ? "Entrando…" : "Entrar no painel"}
          </button>
        </form>
      </div>
    </div>
  );
}
