import { useEffect, useRef, useState } from "react";
import { Bell, Check, CheckCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import adminApi from "../services/api";

function relTime(d) {
  const diff = Math.floor((Date.now() - new Date(d)) / 1000);
  if (diff < 60)   return "agora";
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400)return `${Math.floor(diff / 3600)}h`;
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export default function NotificationBell({ onTaskOpen }) {
  const [notifs,  setNotifs]  = useState([]);
  const [open,    setOpen]    = useState(false);
  const ref = useRef();
  const navigate = useNavigate();

  async function load() {
    try {
      const res = await adminApi.get("/admin/notifications");
      setNotifs(res.data);
    } catch { /* silently fail */ }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 20000); // poll every 20s
    return () => clearInterval(id);
  }, []);

  // Close on outside click
  useEffect(() => {
    function handle(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const unread = notifs.filter((n) => !n.read).length;

  async function markAll() {
    try {
      await adminApi.patch("/admin/notifications/read-all");
      setNotifs((n) => n.map((x) => ({ ...x, read: true })));
    } catch { /* */ }
  }

  async function markOne(id) {
    try {
      await adminApi.patch(`/admin/notifications/${id}/read`);
      setNotifs((n) => n.map((x) => x.id === id ? { ...x, read: true } : x));
    } catch { /* */ }
  }

  function handleClick(n) {
    markOne(n.id);
    setOpen(false);
    if (n.taskId) {
      navigate("/tasks");
      onTaskOpen?.(n.taskId);
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative w-8 h-8 flex items-center justify-center rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition"
      >
        <Bell size={16} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#C4895A] rounded-full text-[9px] font-bold text-white flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 bg-white rounded-2xl shadow-2xl border border-[#E8E0D2] z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#F0EBE3]">
            <span className="text-sm font-bold text-[#1F4D46]">
              Notificações {unread > 0 && <span className="text-[#C4895A]">({unread})</span>}
            </span>
            {unread > 0 && (
              <button onClick={markAll} className="text-xs text-gray-400 hover:text-[#1F4D46] flex items-center gap-1 transition">
                <CheckCheck size={12} /> Marcar todas
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-[#F5F1EA]">
            {notifs.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8">Nenhuma notificação.</p>
            ) : (
              notifs.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`w-full text-left px-4 py-3 hover:bg-[#F5F1EA] transition flex items-start gap-2.5 ${!n.read ? "bg-[#FDFAF5]" : ""}`}
                >
                  {!n.read && <span className="w-2 h-2 bg-[#C4895A] rounded-full shrink-0 mt-1" />}
                  {n.read  && <span className="w-2 h-2 shrink-0 mt-1" />}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${!n.read ? "font-semibold text-[#1F4D46]" : "text-gray-600"}`}>
                      {n.content}
                    </p>
                    {n.taskTitle && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate">📋 {n.taskTitle}</p>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-400 shrink-0 mt-0.5">{relTime(n.createdAt)}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
