import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Bell, CheckCheck } from "lucide-react";
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
  const [pos,     setPos]     = useState({ left: 0, bottom: 0 });
  const btnRef  = useRef();
  const menuRef = useRef();
  const navigate = useNavigate();

  // Ancora o menu (fixed) às coordenadas do sino, abrindo para cima e à direita.
  function openMenu() {
    const r = btnRef.current?.getBoundingClientRect();
    if (r) {
      setPos({
        left:   Math.round(r.left),
        bottom: Math.round(window.innerHeight - r.top + 8),
      });
    }
    setOpen(true);
  }

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

  // Close on outside click (considera o sino e o menu portaled)
  useEffect(() => {
    function handle(e) {
      if (btnRef.current?.contains(e.target)) return;
      if (menuRef.current?.contains(e.target)) return;
      setOpen(false);
    }
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
    <div className="relative">
      <button
        ref={btnRef}
        onClick={() => (open ? setOpen(false) : openMenu())}
        className="relative w-8 h-8 flex items-center justify-center rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition"
      >
        <Bell size={16} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#CBA258] rounded-full text-[9px] font-bold text-white flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && createPortal(
        <div
          ref={menuRef}
          style={{ position: "fixed", left: pos.left, bottom: pos.bottom }}
          className="w-80 max-h-[70vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-[#E6E2D8] z-[9999] overflow-hidden">
          <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-[#E6E2D8]">
            <span className="text-sm font-bold text-[#00704A]">
              Notificações {unread > 0 && <span className="text-[#CBA258]">({unread})</span>}
            </span>
            {unread > 0 && (
              <button onClick={markAll} className="text-xs text-gray-400 hover:text-[#00704A] flex items-center gap-1 transition">
                <CheckCheck size={12} /> Marcar todas
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[#F2F0EB]">
            {notifs.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8">Nenhuma notificação.</p>
            ) : (
              notifs.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`w-full text-left px-4 py-3 hover:bg-[#F2F0EB] transition flex items-start gap-2.5 ${!n.read ? "bg-[#F2F0EB]" : ""}`}
                >
                  {!n.read && <span className="w-2 h-2 bg-[#CBA258] rounded-full shrink-0 mt-1" />}
                  {n.read  && <span className="w-2 h-2 shrink-0 mt-1" />}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${!n.read ? "font-semibold text-[#00704A]" : "text-gray-600"}`}>
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
        </div>,
        document.body
      )}
    </div>
  );
}
