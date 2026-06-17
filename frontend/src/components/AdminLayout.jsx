import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, CheckSquare, TrendingUp, HeartHandshake, Megaphone, LogOut } from "lucide-react";
import { useAdminAuth } from "../contexts/AdminAuthContext";
import NotificationBell from "./NotificationBell";

const NAV = [
  { to: "/",          icon: LayoutDashboard, label: "Dashboard"  },
  { to: "/tasks",     icon: CheckSquare,     label: "Tasks"       },
  { to: "/financial", icon: TrendingUp,      label: "Financeiro"  },
  { to: "/cs",        icon: HeartHandshake,  label: "Customer Success" },
  { to: "/comercial", icon: Megaphone,       label: "Comercial"   },
];

export default function AdminLayout({ children }) {
  const { adminLogout, adminUser: user } = useAdminAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex bg-[#F2F0EB]">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-[#00704A] flex flex-col">
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 56 80" fill="none" className="w-5 h-7">
              <line x1="14" y1="7"  x2="42" y2="7"  stroke="#CBA258" strokeWidth="4" strokeLinecap="round" />
              <line x1="28" y1="7"  x2="28" y2="73" stroke="#CBA258" strokeWidth="4" strokeLinecap="round" />
              <line x1="14" y1="73" x2="42" y2="73" stroke="#CBA258" strokeWidth="4" strokeLinecap="round" />
              <path d="M28 32 Q40 14 44 12 Q46 22 38 28 Q34 31 28 32 Z" fill="#CBA258" opacity="0.85" />
            </svg>
            <span className="text-lg font-bold">
              <span className="text-white">Iaso</span><span className="text-[#CBA258]">clin</span>
            </span>
          </div>
          <p className="text-white/40 text-xs mt-1">Admin Panel</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition font-medium ${
                  isActive
                    ? "bg-white/15 text-white"
                    : "text-white/60 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center justify-between mb-2">
            <p className="text-white/50 text-xs truncate">{user?.name}</p>
            <NotificationBell />
          </div>
          <button
            onClick={() => { adminLogout(); navigate("/login"); }}
            className="flex items-center gap-2 text-white/50 hover:text-white text-xs transition w-full"
          >
            <LogOut size={13} /> Sair
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
