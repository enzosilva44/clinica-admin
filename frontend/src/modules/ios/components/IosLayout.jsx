import { NavLink } from "react-router-dom";
import {
  BrainCircuit,
  Gauge,
  LayoutDashboard,
  Megaphone,
  PackageCheck,
  Scale,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import AdminLayout from "../../../components/AdminLayout";

const TABS = [
  { to: "/ios", label: "Cockpit", icon: LayoutDashboard, end: true },
  { to: "/ios/strategy", label: "Estratégia", icon: Target },
  { to: "/ios/metrics", label: "Métricas", icon: Gauge },
  { to: "/ios/decisions", label: "Decisões", icon: Scale },
  { to: "/ios/performance", label: "Performance", icon: TrendingUp },
  { to: "/ios/commercial", label: "Comercial", icon: Megaphone },
  { to: "/ios/product", label: "Produto", icon: PackageCheck },
  { to: "/ios/people", label: "Pessoas", icon: Users },
];

export default function IosLayout({ title, subtitle, actions, children }) {
  return (
    <AdminLayout>
      <div className="mb-5 overflow-hidden rounded-3xl bg-gradient-to-br from-[#06251B] via-[#00704A] to-[#16845F] px-6 py-6 text-white shadow-lg shadow-[#00704A]/10">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#A9DEC8]">
              <BrainCircuit size={15} /> IASO Operating System
            </div>
            <h1 className="text-2xl font-black">{title}</h1>
            {subtitle && <p className="mt-1 max-w-2xl text-sm text-white/60">{subtitle}</p>}
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
      </div>

      <nav className="mb-6 flex gap-1 overflow-x-auto rounded-2xl border border-[#E1DCCE] bg-white p-1.5">
        {TABS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                isActive ? "bg-[#00704A] text-white" : "text-gray-500 hover:bg-[#F2F0EB] hover:text-[#00704A]"
              }`
            }
          >
            <Icon size={15} /> {label}
          </NavLink>
        ))}
      </nav>

      {children}
    </AdminLayout>
  );
}
