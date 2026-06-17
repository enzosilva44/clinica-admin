import { useEffect, useState, useRef } from "react";
import {
  Plus, Trash2, CheckCircle, Circle, Clock, X, Send,
  Bell, Calendar, ChevronRight, User, Users,
} from "lucide-react";
import AdminLayout from "../components/AdminLayout";
import SecaoInfo from "../components/SecaoInfo";
import MentionTextarea from "../components/MentionTextarea";
import AvatarComp from "../components/Avatar";
import adminApi from "../services/api";
import { useAdminAuth } from "../contexts/AdminAuthContext";
import toast from "react-hot-toast";

// ── Config ────────────────────────────────────────────────────────────────────

const PRIORITIES = ["alta", "media", "baixa"];
const STATUSES   = ["backlog", "fila", "em_andamento", "pendente", "homologacao", "concluido"];
const AREAS      = ["cs", "comercial", "financeiro", "tecnologia", "juridico", "interno"];

const PRIORITY_CFG = {
  alta:  { label: "Alta",  color: "bg-red-100 text-red-600"     },
  media: { label: "Média", color: "bg-amber-100 text-amber-600" },
  baixa: { label: "Baixa", color: "bg-gray-100 text-gray-500"   },
};
const STATUS_CFG = {
  backlog:      { label: "Backlog",      sub: "Despriorizado, sem data definida", icon: Circle,      color: "text-gray-300"   },
  fila:         { label: "Na fila",      sub: "Próximo a executar",              icon: Clock,       color: "text-blue-400"   },
  em_andamento: { label: "Em andamento", sub: null,                            icon: Clock,       color: "text-amber-500"  },
  pendente:     { label: "Pendente",     sub: "Travada, aguardando algo",      icon: Circle,      color: "text-gray-400"   },
  homologacao:  { label: "Homologação",  sub: "Aguardando validação",          icon: Clock,       color: "text-purple-500" },
  concluido:    { label: "Concluído",    sub: null,                            icon: CheckCircle, color: "text-green-500"  },
};
const AREA_COLORS = {
  cs:          "bg-purple-50 text-purple-600",
  comercial:   "bg-emerald-50 text-emerald-600",
  financeiro:  "bg-amber-50 text-amber-600",
  tecnologia:  "bg-blue-50 text-blue-600",
  juridico:    "bg-rose-50 text-rose-600",
  interno:     "bg-gray-100 text-gray-500",
};

const EMPTY_FORM = { title: "", description: "", priority: "media", status: "backlog", module: "interno", area: "interno", dueDate: "", reminderAt: "", assignees: [] };

function initials(name) {
  return (name ?? "?").split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

function fmtDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function fmtDateTime(d) {
  if (!d) return null;
  return new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function isOverdue(dueDate) {
  return dueDate && new Date(dueDate) < new Date();
}

function isReminderDue(reminderAt) {
  return reminderAt && new Date(reminderAt) <= new Date();
}

// ── Avatar list ───────────────────────────────────────────────────────────────

const Avatar = AvatarComp;

// ── Task Detail Drawer ────────────────────────────────────────────────────────

function TaskDrawer({ task, team, currentUser, onClose, onUpdate, onDelete }) {
  const [form, setForm]           = useState({ ...task });
  const [comment, setComment]     = useState("");
  const [sending, setSending]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [showTeam, setShowTeam]   = useState(false);
  const timelineRef = useRef();

  const assignees = form.assignees ?? [];

  useEffect(() => {
    if (timelineRef.current) timelineRef.current.scrollTop = timelineRef.current.scrollHeight;
  }, [task.comments?.length]);

  async function save(patch) {
    setSaving(true);
    try {
      const updated = { ...form, ...patch };
      setForm(updated);
      const res = await adminApi.patch(`/admin/tasks/${task.id}`, patch);
      onUpdate(res.data);
    } catch { toast.error("Erro ao salvar."); setForm(form); }
    finally { setSaving(false); }
  }

  async function addComment() {
    if (!comment.trim()) return;
    setSending(true);
    try {
      const res = await adminApi.post(`/admin/tasks/${task.id}/comments`, {
        content: comment.trim(),
        author:  currentUser?.name ?? "Admin",
        type:    "comment",
      });
      onUpdate({ ...task, comments: [...(task.comments ?? []), res.data] });
      setComment("");
    } catch { toast.error("Erro ao enviar."); }
    finally { setSending(false); }
  }

  async function removeComment(commentId) {
    try {
      await adminApi.delete(`/admin/tasks/${task.id}/comments/${commentId}`);
      onUpdate({ ...task, comments: task.comments.filter((c) => c.id !== commentId) });
    } catch { toast.error("Erro ao remover."); }
  }

  function toggleAssignee(member) {
    const exists = assignees.find((a) => a.id === member.id);
    const next   = exists ? assignees.filter((a) => a.id !== member.id) : [...assignees, { id: member.id, name: member.name }];
    setForm((f) => ({ ...f, assignees: next }));
    save({ assignees: next });
  }

  const overdue   = isOverdue(form.dueDate) && form.status !== "concluido";
  const reminder  = isReminderDue(form.reminderAt) && form.status !== "concluido";

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/30" onClick={onClose} />

      {/* Drawer */}
      <div className="w-full max-w-lg bg-white shadow-2xl flex flex-col h-full overflow-hidden">

        {/* Header */}
        <div className="flex items-start gap-3 px-5 py-4 border-b border-gray-100">
          <button
            onClick={() => {
              const next = STATUSES[(STATUSES.indexOf(form.status) + 1) % STATUSES.length];
              save({ status: next });
              // log status change
              adminApi.post(`/admin/tasks/${task.id}/comments`, {
                content: `Status alterado para "${STATUS_CFG[next].label}"`,
                author: currentUser?.name ?? "Admin",
                type: "status_change",
              }).then((res) => onUpdate({ ...task, comments: [...(task.comments ?? []), res.data] })).catch(() => {});
            }}
            className={`mt-0.5 shrink-0 ${STATUS_CFG[form.status].color}`}
          >
            {(() => { const I = STATUS_CFG[form.status].icon; return <I size={20} />; })()}
          </button>
          <div className="flex-1 min-w-0">
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              onBlur={() => save({ title: form.title })}
              className="w-full text-base font-bold text-[#00704A] bg-transparent focus:outline-none focus:border-b focus:border-[#00704A]"
            />
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${PRIORITY_CFG[form.priority]?.color}`}>
                {PRIORITY_CFG[form.priority]?.label}
              </span>
              {form.area && (
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${AREA_COLORS[form.area] ?? "bg-gray-100 text-gray-500"}`}>
                  {form.area}
                </span>
              )}
              {overdue  && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600">⏰ Atrasada</span>}
              {reminder && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-600">🔔 Lembrete!</span>}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition shrink-0 mt-0.5">
            <X size={18} />
          </button>
        </div>

        {/* Meta */}
        <div className="px-5 py-3 border-b border-gray-100 grid grid-cols-2 gap-3">
          {/* Assignees */}
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Responsáveis</p>
            <div className="flex items-center gap-1.5 flex-wrap">
              {assignees.map((a) => <Avatar key={a.id} name={a.name} size={6} />)}
              <div className="relative">
                <button
                  onClick={() => setShowTeam((v) => !v)}
                  className="w-6 h-6 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-[#00704A] hover:text-[#00704A] transition"
                >
                  <Plus size={10} />
                </button>
                {showTeam && (
                  <div className="absolute left-0 top-8 z-10 bg-white border border-[#E6E2D8] rounded-xl shadow-lg p-2 min-w-44">
                    {team.length === 0 && <p className="text-xs text-gray-400 px-2">Nenhum usuário admin.</p>}
                    {team.map((m) => {
                      const active = assignees.find((a) => a.id === m.id);
                      return (
                        <button
                          key={m.id}
                          onClick={() => { toggleAssignee(m); setShowTeam(false); }}
                          className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm transition ${active ? "bg-[#F0F7F5] text-[#00704A]" : "hover:bg-gray-50 text-gray-700"}`}
                        >
                          <Avatar name={m.name} size={5} />
                          <span className="truncate">{m.name}</span>
                          {active && <CheckCircle size={12} className="ml-auto text-[#00704A]" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-2">
            <div>
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide block mb-0.5">Prazo</label>
              <input
                type="date"
                value={form.dueDate ? form.dueDate.slice(0, 10) : ""}
                onChange={(e) => { setForm((f) => ({ ...f, dueDate: e.target.value })); save({ dueDate: e.target.value || null }); }}
                className={`text-xs border rounded-lg px-2 py-1 bg-white focus:outline-none w-full ${overdue ? "border-red-300 text-red-500" : "border-[#DDD8CC]"}`}
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide block mb-0.5">
                <Bell size={9} className="inline mr-0.5" />Lembrete
              </label>
              <input
                type="datetime-local"
                value={form.reminderAt ? form.reminderAt.slice(0, 16) : ""}
                onChange={(e) => { setForm((f) => ({ ...f, reminderAt: e.target.value })); save({ reminderAt: e.target.value || null }); }}
                className={`text-xs border rounded-lg px-2 py-1 bg-white focus:outline-none w-full ${reminder ? "border-amber-300 text-amber-600" : "border-[#DDD8CC]"}`}
              />
            </div>
          </div>

          {/* Priority + Module */}
          <div>
            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide block mb-0.5">Prioridade</label>
            <select
              value={form.priority}
              onChange={(e) => { setForm((f) => ({ ...f, priority: e.target.value })); save({ priority: e.target.value }); }}
              className="text-xs border border-[#DDD8CC] rounded-lg px-2 py-1 bg-white focus:outline-none w-full"
            >
              {PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY_CFG[p].label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide block mb-0.5">Área</label>
            <select
              value={form.area ?? ""}
              onChange={(e) => { setForm((f) => ({ ...f, area: e.target.value })); save({ area: e.target.value }); }}
              className="text-xs border border-[#DDD8CC] rounded-lg px-2 py-1 bg-white focus:outline-none w-full"
            >
              {AREAS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        {/* Description */}
        <div className="px-5 py-3 border-b border-gray-100">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Descrição</p>
          <MentionTextarea
            value={form.description ?? ""}
            onChange={(v) => setForm((f) => ({ ...f, description: v }))}
            onBlur={() => save({ description: form.description })}
            team={team}
            placeholder="Adicionar descrição… use @ para mencionar alguém"
            rows={2}
            className="w-full text-sm text-gray-700 bg-transparent focus:outline-none resize-none placeholder:text-gray-300"
          />
        </div>

        {/* Timeline */}
        <div ref={timelineRef} className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide sticky top-0 bg-white py-1">Timeline</p>

          {(task.comments ?? []).length === 0 && (
            <p className="text-xs text-gray-300 text-center py-6">Nenhuma atividade ainda.</p>
          )}

          {(task.comments ?? []).map((c) => {
            const isSystem = c.type !== "comment";
            return (
              <div key={c.id} className={`flex gap-2.5 group ${isSystem ? "items-center" : "items-start"}`}>
                {isSystem ? (
                  <>
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0 mt-0.5 ml-2" />
                    <p className="text-xs text-gray-400 italic flex-1">{c.content}</p>
                    <span className="text-[10px] text-gray-300 shrink-0">{fmtDateTime(c.createdAt)}</span>
                  </>
                ) : (
                  <>
                    <Avatar name={c.author} size={6} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xs font-semibold text-[#00704A]">{c.author}</span>
                        <span className="text-[10px] text-gray-400">{fmtDateTime(c.createdAt)}</span>
                      </div>
                      <p className="text-sm text-gray-700 mt-0.5 leading-relaxed">{c.content}</p>
                    </div>
                    <button
                      onClick={() => removeComment(c.id)}
                      className="opacity-0 group-hover:opacity-100 transition text-gray-200 hover:text-red-400 shrink-0 mt-0.5"
                    >
                      <X size={12} />
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Comment input */}
        <div className="px-4 py-3 border-t border-gray-100 flex gap-2 items-end">
          <AvatarComp name={currentUser?.name ?? "Admin"} size={7} />
          <div className="flex-1">
            <MentionTextarea
              value={comment}
              onChange={setComment}
              onEnter={(e) => { e.preventDefault(); addComment(); }}
              team={team}
              placeholder="Escrever comentário… use @ para mencionar alguém"
              rows={1}
              className="w-full border border-[#DDD8CC] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00704A]/20 resize-none"
              style={{ minHeight: 40, maxHeight: 120 }}
            />
          </div>
          <button
            onClick={addComment}
            disabled={sending || !comment.trim()}
            className="bg-[#00704A] hover:bg-[#1E3932] disabled:opacity-40 text-white w-9 h-9 rounded-xl flex items-center justify-center transition shrink-0"
          >
            <Send size={14} />
          </button>
        </div>

        {/* Delete */}
        <div className="px-5 pb-4 flex justify-between items-center">
          <button
            onClick={() => { onDelete(task.id); onClose(); }}
            className="text-xs text-gray-300 hover:text-red-400 transition flex items-center gap-1"
          >
            <Trash2 size={12} /> Excluir task
          </button>
          {saving && <span className="text-xs text-gray-400 animate-pulse">Salvando…</span>}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function Tasks() {
  const { adminUser } = useAdminAuth();
  const [tasks,    setTasks]    = useState([]);
  const [draggingId,      setDraggingId]      = useState(null);
  const [dragOverColumn,  setDragOverColumn]  = useState(null);
  const draggingIdRef = useRef(null);
  const [team,     setTeam]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [saving,   setSaving]   = useState(false);
  const [selected, setSelected] = useState(null); // task open in drawer
  const [myOnly,   setMyOnly]   = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterArea, setFilterModule] = useState("");

  async function load() {
    setLoading(true);
    try {
      const [tasksRes, teamRes] = await Promise.all([
        adminApi.get("/admin/tasks"),
        adminApi.get("/admin/team"),
      ]);
      setTasks(tasksRes.data);
      setTeam(teamRes.data);
    } catch { toast.error("Erro ao carregar tasks"); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  // Browser reminders
  useEffect(() => {
    const due = tasks.filter(
      (t) => t.status !== "concluido" && isReminderDue(t.reminderAt) && !t._reminderNotified
    );
    if (due.length > 0 && "Notification" in window) {
      Notification.requestPermission().then((perm) => {
        if (perm === "granted") {
          due.forEach((t) => {
            new Notification("🔔 Lembrete de task", { body: t.title });
          });
        }
      });
    }
  }, [tasks]);

  async function createTask() {
    if (!form.title.trim()) return toast.error("Título obrigatório.");
    setSaving(true);
    try {
      const res = await adminApi.post("/admin/tasks", form);
      setTasks((t) => [res.data, ...t]);
      setForm(EMPTY_FORM);
      setShowForm(false);
      toast.success("Task criada!");
    } catch { toast.error("Erro ao criar task."); }
    finally { setSaving(false); }
  }

  async function dropOnColumn(targetStatus) {
    setDragOverColumn(null);
    const id = draggingIdRef.current;
    if (!id) return;
    const task = tasks.find((t) => t.id === id);
    draggingIdRef.current = null;
    setDraggingId(null);
    if (!task || task.status === targetStatus) return;
    // Optimistic update
    setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: targetStatus } : t));
    try {
      const res = await adminApi.patch(`/admin/tasks/${task.id}`, { status: targetStatus });
      setTasks((prev) => prev.map((t) => t.id === res.data.id ? res.data : t));
    } catch {
      // Revert
      setTasks((prev) => prev.map((t) => t.id === task.id ? task : t));
      toast.error("Erro ao mover task.");
    }
  }

  function updateTask(updated) {
    setTasks((prev) => prev.map((t) => t.id === updated.id ? updated : t));
    if (selected?.id === updated.id) setSelected(updated);
  }

  async function deleteTask(id) {
    if (!confirm("Remover esta task?")) return;
    try {
      await adminApi.delete(`/admin/tasks/${id}`);
      setTasks((t) => t.filter((x) => x.id !== id));
      toast.success("Task removida.");
    } catch { toast.error("Erro ao remover."); }
  }

  async function cycleStatus(task, e) {
    e.stopPropagation();
    const next = STATUSES[(STATUSES.indexOf(task.status) + 1) % STATUSES.length];
    try {
      const res = await adminApi.patch(`/admin/tasks/${task.id}`, { status: next });
      // Also log status change
      await adminApi.post(`/admin/tasks/${task.id}/comments`, {
        content: `Status alterado para "${STATUS_CFG[next].label}"`,
        author: adminUser?.name ?? "Admin",
        type: "status_change",
      });
      updateTask({ ...res.data });
    } catch { toast.error("Erro ao atualizar."); }
  }

  const visible = tasks.filter((t) => {
    if (filterStatus && t.status !== filterStatus) return false;
    if (filterArea && t.area !== filterArea) return false;
    if (myOnly && adminUser) {
      const assignees = t.assignees ?? [];
      return assignees.some((a) => a.id === adminUser.id || a.name === adminUser.name);
    }
    return true;
  });

  const grouped = STATUSES.reduce((acc, s) => {
    acc[s] = visible.filter((t) => t.status === s);
    return acc;
  }, {});

  const reminderCount = tasks.filter((t) => t.status !== "concluido" && isReminderDue(t.reminderAt)).length;

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-[#00704A] flex items-center gap-2">
            Tasks
            {reminderCount > 0 && (
              <span className="text-sm font-semibold bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Bell size={12} /> {reminderCount} lembrete{reminderCount !== 1 ? "s" : ""}
              </span>
            )}
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">{tasks.length} tarefa{tasks.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-[#00704A] hover:bg-[#1E3932] text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition"
        >
          <Plus size={15} /> Nova task
        </button>
      </div>

      <SecaoInfo itens={[
        { nome: "Quadro Kanban", desc: "Organize tarefas em 6 colunas: Backlog, Na fila, Em andamento, Pendente, Homologação e Concluído. Arraste os cards entre as colunas." },
        { nome: "Responsáveis", desc: "Atribua uma ou mais pessoas a cada task. Use o filtro 'Minhas' para ver só as suas." },
        { nome: "Detalhe e timeline", desc: "Clique num card para abrir o painel com descrição, prazo, lembrete e o histórico de comentários da tarefa." },
        { nome: "@menções", desc: "Mencione um sócio com @ nos comentários ou na descrição — ele recebe uma notificação no sino." },
        { nome: "Prazo e lembrete", desc: "Defina data de entrega e um lembrete com hora; o card avisa quando vence e dispara notificação no navegador." },
        { nome: "Áreas", desc: "Classifique por área (CS, Comercial, Financeiro, Tecnologia, Jurídico, Interno) e filtre por ela." },
      ]} />

      {/* New task form */}
      {showForm && (
        <div className="bg-white border border-[#E6E2D8] rounded-2xl p-5 mb-5 space-y-3">
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Título da task *"
            className="w-full border border-[#DDD8CC] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00704A]/20"
          />
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Descrição (opcional)"
            rows={2}
            className="w-full border border-[#DDD8CC] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none resize-none"
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Prioridade</label>
              <select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                className="w-full border border-[#DDD8CC] rounded-xl px-3 py-2 text-sm bg-white focus:outline-none">
                {PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY_CFG[p].label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Área</label>
              <select value={form.area} onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}
                className="w-full border border-[#DDD8CC] rounded-xl px-3 py-2 text-sm bg-white focus:outline-none">
                {AREAS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Prazo</label>
              <input type="date" value={form.dueDate}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                className="w-full border border-[#DDD8CC] rounded-xl px-3 py-2 text-sm bg-white focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">
                <Bell size={10} className="inline mr-0.5" />Lembrete
              </label>
              <input type="datetime-local" value={form.reminderAt}
                onChange={(e) => setForm((f) => ({ ...f, reminderAt: e.target.value }))}
                className="w-full border border-[#DDD8CC] rounded-xl px-3 py-2 text-sm bg-white focus:outline-none" />
            </div>
          </div>
          {/* Assignees in form */}
          <div>
            <p className="text-xs text-gray-400 mb-1.5">Responsáveis</p>
            <div className="flex flex-wrap gap-2">
              {team.map((m) => {
                const active = (form.assignees ?? []).find((a) => a.id === m.id);
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      const next = active
                        ? form.assignees.filter((a) => a.id !== m.id)
                        : [...(form.assignees ?? []), { id: m.id, name: m.name }];
                      setForm((f) => ({ ...f, assignees: next }));
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs transition ${active ? "bg-[#F0F7F5] border-[#00704A]/30 text-[#00704A]" : "border-[#E6E2D8] text-gray-500 hover:border-[#CBA258]"}`}
                  >
                    <Avatar name={m.name} size={5} /> {m.name}
                    {active && <CheckCircle size={11} className="text-[#00704A]" />}
                  </button>
                );
              })}
              {team.length === 0 && <p className="text-xs text-gray-400">Nenhum usuário admin cadastrado.</p>}
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}
              className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded-xl transition">Cancelar</button>
            <button onClick={createTask} disabled={saving}
              className="bg-[#00704A] hover:bg-[#1E3932] disabled:opacity-50 text-white px-5 py-2 rounded-xl text-sm font-medium transition">
              {saving ? "Criando…" : "Criar task"}
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-5 flex-wrap items-center">
        <div className="flex bg-white border border-[#E6E2D8] rounded-xl p-0.5">
          <button onClick={() => setMyOnly(false)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${!myOnly ? "bg-[#00704A] text-white" : "text-gray-500 hover:text-[#00704A]"}`}>
            <Users size={12} /> Todas
          </button>
          <button onClick={() => setMyOnly(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${myOnly ? "bg-[#00704A] text-white" : "text-gray-500 hover:text-[#00704A]"}`}>
            <User size={12} /> Minhas
          </button>
        </div>

        <div className="w-px h-5 bg-[#E6E2D8]" />

        {["", ...STATUSES].map((s) => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filterStatus === s ? "bg-[#00704A] text-white" : "bg-white border border-[#E6E2D8] text-gray-500 hover:border-[#00704A]"}`}>
            {s ? STATUS_CFG[s].label : "Todos status"}
          </button>
        ))}

        <select value={filterArea} onChange={(e) => setFilterModule(e.target.value)}
          className="ml-auto border border-[#E6E2D8] rounded-lg px-3 py-1.5 text-xs bg-white text-gray-500 focus:outline-none">
          <option value="">Todas as áreas</option>
          {AREAS.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {/* Board */}
      {loading ? (
        <div className="grid grid-cols-3 gap-3">
          {[1,2,3,4,5,6].map((i) => <div key={i} className="h-48 bg-white rounded-2xl animate-pulse border border-[#E6E2D8]" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 overflow-x-auto">
          {STATUSES.map((s) => {
            const { label, sub, icon: Icon, color } = STATUS_CFG[s];
            return (
              <div
                key={s}
                className={`rounded-2xl overflow-hidden border transition-colors ${dragOverColumn === s ? "border-[#00704A] bg-[#F0F7F5]" : "bg-white border-[#E6E2D8]"}`}
                onDragOver={(e) => { e.preventDefault(); setDragOverColumn(s); }}
                onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOverColumn(null); }}
                onDrop={(e) => { e.preventDefault(); dropOnColumn(s); }}
              >
                <div className="px-3 py-2.5 border-b border-[#E6E2D8]">
                  <div className="flex items-center gap-1.5">
                    <Icon size={13} className={color} />
                    <span className="text-sm font-semibold text-[#00704A] leading-none">{label}</span>
                    <span className="ml-auto text-xs text-gray-400 shrink-0">{grouped[s].length}</span>
                  </div>
                  {sub && <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{sub}</p>}
                </div>
                <div className="p-3 space-y-2.5 min-h-32">
                  {grouped[s].map((task) => {
                    const assignees    = task.assignees ?? [];
                    const overdue      = isOverdue(task.dueDate)    && task.status !== "concluido";
                    const hasReminder  = isReminderDue(task.reminderAt) && task.status !== "concluido";
                    const commentCount = task.comments?.length ?? 0;
                    const isDragging   = draggingId === task.id;

                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={() => { draggingIdRef.current = task.id; setDraggingId(task.id); }}
                        onDragEnd={() => { draggingIdRef.current = null; setDraggingId(null); setDragOverColumn(null); }}
                        onClick={() => !draggingId && setSelected(task)}
                        className={`bg-[#F2F0EB] border rounded-xl p-3 cursor-grab active:cursor-grabbing hover:shadow-sm transition group ${overdue ? "border-red-200" : "border-[#E6E2D8]"} ${isDragging ? "opacity-40 scale-95" : ""}`}
                      >
                        {/* Title row */}
                        <div className="flex items-start justify-between gap-1.5 mb-2">
                          <p className="text-sm font-medium text-[#00704A] leading-tight flex-1">{task.title}</p>
                          <button
                            onClick={(e) => cycleStatus(task, e)}
                            className={`shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition ${color}`}
                            title="Avançar status"
                          >
                            <ChevronRight size={14} />
                          </button>
                        </div>

                        {/* Badges */}
                        <div className="flex items-center gap-1 flex-wrap mb-2">
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${PRIORITY_CFG[task.priority]?.color}`}>
                            {PRIORITY_CFG[task.priority]?.label}
                          </span>
                          {task.area && (
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${AREA_COLORS[task.area] ?? "bg-gray-100 text-gray-500"}`}>
                              {task.area}
                            </span>
                          )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between">
                          {/* Assignee avatars */}
                          <div className="flex -space-x-1">
                            {assignees.slice(0, 3).map((a) => (
                              <div key={a.id} className="ring-1 ring-white rounded-full">
                                <Avatar name={a.name} size={5} />
                              </div>
                            ))}
                            {assignees.length === 0 && (
                              <div className="w-5 h-5 rounded-full border border-dashed border-gray-300 flex items-center justify-center">
                                <User size={9} className="text-gray-300" />
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {commentCount > 0 && (
                              <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                                💬 {commentCount}
                              </span>
                            )}
                            {hasReminder && <Bell size={11} className="text-amber-500" />}
                            {task.dueDate && (
                              <span className={`text-[10px] flex items-center gap-0.5 ${overdue ? "text-red-500 font-semibold" : "text-gray-400"}`}>
                                <Calendar size={9} /> {fmtDate(task.dueDate)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {grouped[s].length === 0 && (
                    <p className="text-xs text-gray-300 text-center py-4">Nenhuma task</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Drawer */}
      {selected && (
        <TaskDrawer
          task={selected}
          team={team}
          currentUser={adminUser}
          onClose={() => setSelected(null)}
          onUpdate={updateTask}
          onDelete={deleteTask}
        />
      )}
    </AdminLayout>
  );
}
