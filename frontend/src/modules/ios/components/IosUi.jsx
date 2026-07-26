import { X, LoaderCircle, Inbox, AlertTriangle } from "lucide-react";
import { STATUS_LABEL, STATUS_STYLE } from "../iosFormat";

export function IosButton({
  children,
  variant = "primary",
  className = "",
  type = "button",
  ...props
}) {
  const variants = {
    primary: "bg-[#00704A] text-white hover:bg-[#005C3D] border-[#00704A]",
    secondary: "bg-white text-[#00704A] hover:bg-emerald-50 border-[#BFD8CE]",
    ghost: "bg-transparent text-gray-500 hover:bg-black/5 border-transparent",
    danger: "bg-white text-red-600 hover:bg-red-50 border-red-200",
  };
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function IosBadge({ status }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${STATUS_STYLE[status] ?? "bg-gray-100 text-gray-600"}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

export function IosProgress({ value, compact = false }) {
  if (value === null || value === undefined) {
    return <span className="text-xs text-gray-400">Sem medição</span>;
  }
  const safe = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className={compact ? "min-w-24" : "w-full"}>
      <div className="mb-1 flex items-center justify-between text-[11px]">
        {!compact && <span className="text-gray-400">Progresso</span>}
        <span className="font-bold text-[#00704A]">{safe}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[#E8E4DA]">
        <div className="h-full rounded-full bg-[#00704A] transition-all" style={{ width: `${safe}%` }} />
      </div>
    </div>
  );
}

export function IosField({ label, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-gray-600">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-gray-400">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "w-full rounded-xl border border-[#DCD7CB] bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition placeholder:text-gray-300 focus:border-[#00704A] focus:ring-2 focus:ring-[#00704A]/10";

export function IosModal({ open, title, subtitle, onClose, children, width = "max-w-xl" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#06251B]/45 p-4 backdrop-blur-[2px]">
      <div className={`max-h-[90vh] w-full ${width} overflow-y-auto rounded-3xl border border-white/50 bg-[#FAF7F2] shadow-2xl`}>
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-[#E6E2D8] bg-[#FAF7F2]/95 px-6 py-5 backdrop-blur">
          <div>
            <h2 className="text-lg font-black text-[#00704A]">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-gray-400">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 transition hover:bg-black/5 hover:text-gray-700">
            <X size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export function IosLoading({ label = "Carregando IOS…" }) {
  return (
    <div className="flex min-h-48 items-center justify-center gap-2 text-sm text-gray-400">
      <LoaderCircle size={18} className="animate-spin text-[#00704A]" /> {label}
    </div>
  );
}

export function IosError({ message, onRetry }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
      <div className="flex items-center gap-2 font-semibold"><AlertTriangle size={16} /> {message}</div>
      {onRetry && <IosButton variant="danger" className="mt-3" onClick={onRetry}>Tentar novamente</IosButton>}
    </div>
  );
}

export function IosEmpty({ title, description, action }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#D6D0C2] bg-white/50 p-8 text-center">
      <Inbox size={28} className="mx-auto mb-3 text-[#A9DEC8]" />
      <p className="font-bold text-gray-700">{title}</p>
      {description && <p className="mx-auto mt-1 max-w-md text-sm text-gray-400">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
