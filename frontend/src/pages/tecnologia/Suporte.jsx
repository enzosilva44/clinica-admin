import { useEffect, useMemo, useRef, useState } from "react";
import {
  RefreshCw, AlertTriangle, Inbox, Send, StickyNote,
  UserPlus, ArrowRightLeft, CheckCircle2, RotateCcw, Building2, Phone, Clock,
  MessageSquarePlus, Lock, X, FileText,
} from "lucide-react";
import AdminLayout from "../../components/AdminLayout";
import adminApi from "../../services/api";
import TecBreadcrumb from "./TecBreadcrumb";
import { useAdminAuth } from "../../contexts/AdminAuthContext";

// Abas no topo da lista, no espírito do "Tudo / Não lidas" do WhatsApp.
// Cada uma é um recorte pronto do trabalho, não um espelho cru do status:
// "Fila" junta triagem+aguardando porque, para quem atende, os dois querem
// dizer a mesma coisa — ninguém pegou ainda.
const ABAS = [
  { key: "tudo",       label: "Tudo" },
  { key: "nao_lidos",  label: "Não lidos" },
  { key: "fila",       label: "Na fila" },
  { key: "meus",       label: "Meus" },
  { key: "resolvidos", label: "Resolvidos" },
];

// Rótulo e cor de cada status, para o selo dentro da linha da conversa.
const STATUS_INFO = {
  triagem:        { label: "Em triagem",     color: "#CBA258" },
  aguardando:     { label: "Aguardando",     color: "#0EA5E9" },
  em_atendimento: { label: "Em atendimento", color: "#00704A" },
  resolvido:      { label: "Resolvido",      color: "#94A3B8" },
  encerrado:      { label: "Encerrado",      color: "#94A3B8" },
};

// Duas letras do nome, como o avatar de contato sem foto.
function iniciais(nome) {
  const partes = String(nome || "").trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

// Cor estável por contato: mesma pessoa, mesma cor, sem guardar nada.
const CORES_AVATAR = ["#00704A", "#CBA258", "#0EA5E9", "#8B5CF6", "#EC4899", "#F97316"];
function corDoAvatar(chave) {
  const s = String(chave || "");
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return CORES_AVATAR[h % CORES_AVATAR.length];
}

const POLL_MS = 5000; // decisão do MVP: polling, sem WebSocket

function horaCurta(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const hoje = new Date();
  const mesmoDia = d.toDateString() === hoje.toDateString();
  return mesmoDia
    ? d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function telefoneBonito(phone) {
  if (!phone) return "—";
  const d = phone.replace(/\D/g, "").replace(/^55/, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return phone;
}

function Pill({ children, color = "#94A3B8" }) {
  return (
    <span
      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
      style={{ color, backgroundColor: `${color}1A` }}
    >
      {children}
    </span>
  );
}

// Descrição do anexo quando não dá para exibi-lo (download falhou, tipo que não
// renderiza). Vale para o corpo da bolha e para a lista de conversas.
function resumoSemTexto(kind) {
  switch (kind) {
    case "image":
    case "sticker":  return "📷 Foto";
    case "document": return "📄 Documento";
    case "audio":    return "🎤 Áudio";
    case "video":    return "🎬 Vídeo";
    case "location": return "📍 Localização";
    case "contacts": return "👤 Contato";
    default:         return `[${kind || "mensagem"}]`;
  }
}

function tamanhoBonito(bytes) {
  if (!bytes) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Anexo de uma mensagem.
//
// O arquivo vive num bucket privado e a rota que o serve exige o token do
// atendente no header Authorization — o que <img src> não manda. Por isso o
// binário é buscado pelo adminApi e vira uma blob: URL local.
//
// A URL é revogada ao desmontar: sem isso, cada ticket aberto deixaria os
// anexos presos na memória da aba pelo resto da sessão.
function Anexo({ m, meu }) {
  const [src, setSrc] = useState(null);
  const [erro, setErro] = useState(false);
  const [tamanho, setTamanho] = useState(null);

  const ehImagem = (m.mediaMimeType || "").startsWith("image/");
  const ehAudio  = (m.mediaMimeType || "").startsWith("audio/");
  const ehVideo  = (m.mediaMimeType || "").startsWith("video/");
  // Documento baixa em vez de tocar na página, então não precisa do blob.
  const precisaCarregar = ehImagem || ehAudio || ehVideo;

  useEffect(() => {
    if (!m.mediaUrl || !precisaCarregar) return;
    let url = null;
    let vivo = true;

    adminApi
      .get(`/admin/support/messages/${m.id}/media`, { responseType: "blob" })
      .then((res) => {
        if (!vivo) return;
        url = URL.createObjectURL(res.data);
        setTamanho(res.data.size);
        setSrc(url);
      })
      .catch(() => vivo && setErro(true));

    return () => {
      vivo = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [m.id, m.mediaUrl, precisaCarregar]);

  if (!m.mediaUrl) return null;

  // Anexo que não carregou não pode sumir em silêncio: o atendente precisa
  // saber que veio um arquivo, mesmo sem conseguir vê-lo.
  if (erro) {
    return (
      <div className={`text-xs rounded-xl px-3 py-2 mb-1.5 ${meu ? "bg-white/15" : "bg-gray-200/70"}`}>
        {resumoSemTexto(m.kind)} · não foi possível carregar
      </div>
    );
  }

  const baixar = async () => {
    try {
      const res = await adminApi.get(`/admin/support/messages/${m.id}/media`, { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = m.mediaFilename || "anexo";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setErro(true);
    }
  };

  if (ehImagem) {
    if (!src) {
      return <div className={`h-40 w-52 rounded-xl mb-1.5 animate-pulse ${meu ? "bg-white/20" : "bg-gray-200"}`} />;
    }
    return (
      <button onClick={baixar} className="block mb-1.5 cursor-zoom-in" title="Baixar imagem">
        <img
          src={src}
          alt={m.mediaFilename || "Imagem enviada pelo cliente"}
          className="rounded-xl max-h-72 max-w-full object-contain"
        />
      </button>
    );
  }

  if (ehAudio) {
    return src
      ? <audio controls src={src} className="mb-1.5 max-w-full" />
      : <div className={`h-10 w-52 rounded-xl mb-1.5 animate-pulse ${meu ? "bg-white/20" : "bg-gray-200"}`} />;
  }

  if (ehVideo) {
    return src
      ? <video controls src={src} className="rounded-xl mb-1.5 max-h-72 max-w-full" />
      : <div className={`h-40 w-52 rounded-xl mb-1.5 animate-pulse ${meu ? "bg-white/20" : "bg-gray-200"}`} />;
  }

  // Documento e qualquer outro tipo: cartão clicável com nome e tamanho.
  return (
    <button
      onClick={baixar}
      className={`flex items-center gap-2 rounded-xl px-3 py-2 mb-1.5 w-full text-left transition ${
        meu ? "bg-white/15 hover:bg-white/25" : "bg-gray-200/70 hover:bg-gray-200"
      }`}
    >
      <FileText size={16} className="shrink-0" />
      <span className="min-w-0">
        <span className="block text-xs font-semibold truncate">{m.mediaFilename || "Documento"}</span>
        <span className={`block text-[10px] ${meu ? "text-white/70" : "text-gray-500"}`}>
          {tamanhoBonito(tamanho) ? `${tamanhoBonito(tamanho)} · ` : ""}Baixar
        </span>
      </span>
    </button>
  );
}

// Estado da janela de 24h do WhatsApp, em português de atendente.
//
// A regra da Meta: texto livre só nas 24h seguintes à mensagem DO CLIENTE.
// Enviar template não abre a janela — só a resposta dele abre. Por isso os três
// estados abaixo são diferentes entre si: "ainda não respondeu" e "fechou" têm
// a mesma consequência (só template), mas dizem coisas opostas sobre a conversa.
function janelaInfo(window) {
  if (!window) return null;
  if (window.open) {
    const fim = new Date(window.expiresAt);
    const horas = Math.max(0, Math.round((fim - Date.now()) / 3600000));
    return {
      open: true,
      color: "#00704A",
      curto: `aberta até ${fim.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`,
      titulo: `Janela aberta — restam cerca de ${horas}h`,
      detalhe: "Você pode escrever livremente até esse horário.",
    };
  }
  if (window.reason === "sem_resposta") {
    return {
      open: false,
      color: "#CBA258",
      curto: "aguardando resposta",
      titulo: "Este contato ainda não respondeu",
      detalhe:
        "Enviar um modelo não abre a janela de 24h — só a resposta dele abre. Até lá, o WhatsApp recusa mensagem escrita à mão.",
    };
  }
  return {
    open: false,
    color: "#94A3B8",
    curto: "fechada — precisa de modelo",
    titulo: "A janela de 24h fechou",
    detalhe:
      "Passaram-se mais de 24h desde a última mensagem do contato. Para reabrir a conversa é preciso enviar um modelo aprovado.",
  };
}

// Nós ligando para o cliente. Só modelo aprovado: quem nunca nos escreveu está,
// por definição, fora da janela de 24h.
function ModalNovaConversa({ templates, onFechar, onCriada }) {
  const [phone, setPhone] = useState("");
  const [waName, setWaName] = useState("");
  const [templateName, setTemplateName] = useState(templates[0]?.name ?? "");
  const [values, setValues] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);

  const template = templates.find((t) => t.name === templateName) ?? null;

  // Prévia com o que já foi digitado: o atendente vê a mensagem como ela vai
  // chegar, e não o template cru com {{1}} no meio.
  const previa = useMemo(() => {
    if (!template) return "";
    let txt = template.preview ?? "";
    (template.fields ?? []).forEach((f, i) => {
      const v = String(values[f.key] ?? "").trim();
      txt = txt.replaceAll(`{{${i + 1}}}`, v || `[${f.label.toLowerCase()}]`);
    });
    return txt;
  }, [template, values]);

  async function enviar(e) {
    e.preventDefault();
    if (enviando) return;
    setEnviando(true);
    setErro(null);
    try {
      const { data } = await adminApi.post("/admin/support/conversations", {
        phone, waName: waName.trim() || undefined, templateName, values,
      });
      onCriada(data.ticketId);
    } catch (e2) {
      const resp = e2?.response?.data;
      // 409: já existe conversa viva com esse contato — em vez de erro seco,
      // levamos o atendente até ela.
      if (e2?.response?.status === 409 && resp?.ticketId) {
        onCriada(resp.ticketId);
        return;
      }
      setErro(resp?.error || "Não foi possível iniciar a conversa.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-[#E6E2D8] w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E6E2D8]">
          <div>
            <div className="font-semibold text-gray-800">Nova conversa</div>
            <div className="text-[11px] text-gray-400">
              A central escreve primeiro, pelo WhatsApp da IASO.
            </div>
          </div>
          <button onClick={onFechar} className="text-gray-400 hover:text-gray-600 transition">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={enviar} className="px-5 py-4 space-y-4">
          {erro && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-3 py-2.5 text-xs flex items-start gap-2">
              <AlertTriangle size={14} className="shrink-0 mt-px" /> {erro}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[11px] font-semibold text-gray-500">WhatsApp *</span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(16) 99161-2272"
                required
                className="mt-1 w-full text-sm border border-[#E6E2D8] rounded-xl px-3 py-2 outline-none focus:border-[#00704A] transition"
              />
            </label>
            <label className="block">
              <span className="text-[11px] font-semibold text-gray-500">Nome do contato</span>
              <input
                value={waName}
                onChange={(e) => setWaName(e.target.value)}
                placeholder="Como aparece na sua lista"
                className="mt-1 w-full text-sm border border-[#E6E2D8] rounded-xl px-3 py-2 outline-none focus:border-[#00704A] transition"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-[11px] font-semibold text-gray-500">Modelo de mensagem *</span>
            <select
              value={templateName}
              onChange={(e) => { setTemplateName(e.target.value); setValues({}); }}
              className="mt-1 w-full text-sm border border-[#E6E2D8] rounded-xl px-3 py-2 outline-none focus:border-[#00704A] transition bg-white"
            >
              {templates.map((t) => (
                <option key={t.name} value={t.name}>
                  {t.label}{t.status !== "APPROVED" ? " — em análise" : ""}
                </option>
              ))}
            </select>
            {template?.description && (
              <span className="text-[11px] text-gray-400 mt-1 block">{template.description}</span>
            )}
          </label>

          {/* Modelo ainda não aprovado: avisa aqui em vez de deixar o atendente
              escrever tudo e tomar o erro da Meta no clique final. */}
          {template && template.status !== "APPROVED" && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-[11px] text-amber-800 flex items-start gap-2">
              <Clock size={13} className="shrink-0 mt-px" />
              <span>
                {template.status === "REJECTED"
                  ? "Este modelo foi reprovado pela Meta e precisa ser reescrito antes de poder ser usado."
                  : "Este modelo ainda está em análise pela Meta. O envio fica bloqueado até a aprovação sair — nada precisa ser refeito aqui depois."}
              </span>
            </div>
          )}

          {/* Campos vindos do catálogo do backend: template novo aparece aqui
              sozinho, sem mexer nesta tela. */}
          {(template?.fields ?? []).map((f) => (
            <label key={f.key} className="block">
              <span className="text-[11px] font-semibold text-gray-500">
                {f.label}{f.required && " *"}
              </span>
              {f.multiline ? (
                <textarea
                  value={values[f.key] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  required={f.required}
                  maxLength={f.maxLength}
                  rows={3}
                  className="mt-1 w-full text-sm border border-[#E6E2D8] rounded-xl px-3 py-2 outline-none focus:border-[#00704A] transition resize-none"
                />
              ) : (
                <input
                  value={values[f.key] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  required={f.required}
                  maxLength={f.maxLength}
                  className="mt-1 w-full text-sm border border-[#E6E2D8] rounded-xl px-3 py-2 outline-none focus:border-[#00704A] transition"
                />
              )}
              {f.hint && <span className="text-[11px] text-gray-400 mt-1 block">{f.hint}</span>}
            </label>
          ))}

          {previa && (
            <div>
              <div className="text-[11px] font-semibold text-gray-500 mb-1.5">
                Como vai chegar
              </div>
              <div className="bg-[#00704A] text-white rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap">
                {previa}
              </div>
            </div>
          )}

          {/* O aviso que evita a pergunta "mandei e não consigo responder?". */}
          <div className="bg-[#FDF6E3] border border-[#E9DDBF] rounded-xl px-3 py-2.5 text-[11px] text-[#6B5426] flex items-start gap-2">
            <Lock size={13} className="shrink-0 mt-px" />
            <span>
              Depois de enviar, a caixa de resposta fica bloqueada até a pessoa
              responder — o WhatsApp só libera texto livre a partir da resposta dela.
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onFechar}
              className="text-xs font-semibold px-3 py-2 rounded-xl border border-[#E6E2D8] text-gray-600 hover:border-gray-300 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando || !phone.trim() || !template || template.status !== "APPROVED"}
              title={
                template && template.status !== "APPROVED"
                  ? "Modelo ainda não aprovado pela Meta"
                  : undefined
              }
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl bg-[#00704A] text-white hover:opacity-90 transition disabled:opacity-40"
            >
              <Send size={13} /> {enviando ? "Enviando…" : "Enviar e abrir conversa"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Suporte() {
  const { adminUser } = useAdminAuth();
  const [overview, setOverview] = useState(null);
  // Dois recortes independentes: `aba` é o recorte de trabalho, `setor` é o
  // departamento. Combinam livremente ("Resolvidos" + "Comercial" = histórico
  // do Comercial).
  const [aba, setAba] = useState("tudo");
  const [setor, setSetor] = useState("");
  const [tickets, setTickets] = useState([]);
  const [abertoId, setAbertoId] = useState(null);
  const [ticket, setTicket] = useState(null);
  const [nota, setNota] = useState("");
  const [resposta, setResposta] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [err, setErr] = useState(null);
  const [aviso, setAviso] = useState(null);
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState([]);
  const [novaConversa, setNovaConversa] = useState(false);
  const fimDaTimeline = useRef(null);

  async function carregarLista() {
    try {
      // Só "Resolvidos" mapeia 1-para-1 num status da API. As outras abas ou
      // cruzam status ("Na fila") ou filtram por outro campo (não lidas,
      // atribuição), então buscamos o conjunto e recortamos abaixo — a lista
      // é curta (50) e evita multiplicar endpoints por recorte de tela.
      const params = new URLSearchParams({ limit: "50" });
      if (aba === "resolvidos") params.set("status", "resolvido");
      if (aba === "meus" && adminUser?.id) params.set("assigneeId", adminUser.id);
      if (setor) params.set("departmentId", setor);
      const [o, l] = await Promise.all([
        adminApi.get("/admin/support/overview"),
        adminApi.get(`/admin/support/tickets?${params}`),
      ]);
      setOverview(o.data);
      setTickets(l.data?.data ?? []);
      setErr(null);
    } catch (e) {
      setErr(e?.response?.data?.error || "Não foi possível carregar os chamados.");
    } finally {
      setLoading(false);
    }
  }

  async function abrir(id) {
    setAbertoId(id);
    try {
      const { data } = await adminApi.get(`/admin/support/tickets/${id}`);
      setTicket(data);
      if (data?.unreadCount > 0) {
        await adminApi.post(`/admin/support/tickets/${id}/read`);
        carregarLista();
      }
    } catch (e) {
      setErr(e?.response?.data?.error || "Não foi possível abrir o chamado.");
    }
  }

  // Uma ação só faz sentido com a lista e a conversa atualizadas depois dela.
  async function agir(acao, body) {
    if (!abertoId) return;
    try {
      await adminApi.post(`/admin/support/tickets/${abertoId}/${acao}`, body ?? {});
      setAviso(null);
      await Promise.all([carregarLista(), abrir(abertoId)]);
    } catch (e) {
      // 409 = outro atendente assumiu primeiro; é aviso, não erro de sistema.
      const msg = e?.response?.data?.error || "Não foi possível concluir a ação.";
      if (e?.response?.status === 409) { setAviso(msg); await abrir(abertoId); }
      else setErr(msg);
    }
  }

  async function salvarNota(e) {
    e.preventDefault();
    const texto = nota.trim();
    if (!texto) return;
    setNota("");
    await agir("notes", { text: texto });
  }

  // Resposta ao cliente: só limpa o campo se a Meta aceitou. Fora da janela de
  // 24h o envio é recusado, e apagar o texto faria o atendente perder o que
  // escreveu junto com a explicação do porquê.
  async function enviarResposta(e) {
    e.preventDefault();
    const texto = resposta.trim();
    if (!texto || enviando) return;
    setEnviando(true);
    try {
      await adminApi.post(`/admin/support/tickets/${abertoId}/reply`, { text: texto });
      setResposta("");
      setErr(null);
      await Promise.all([carregarLista(), abrir(abertoId)]);
    } catch (e2) {
      setErr(e2?.response?.data?.error || "Não foi possível enviar a mensagem.");
    } finally {
      setEnviando(false);
    }
  }

  useEffect(() => { setLoading(true); carregarLista(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [aba, setor]);

  // Catálogo de modelos: uma vez só, é lista estática do backend. Sem ele o
  // botão de nova conversa não tem o que oferecer, então some da tela.
  useEffect(() => {
    adminApi.get("/admin/support/templates")
      .then(({ data }) => setTemplates(Array.isArray(data) ? data : []))
      .catch(() => setTemplates([]));
  }, []);

  // Polling: mantém filas e conversa aberta frescas sem recarregar a página.
  useEffect(() => {
    const t = setInterval(() => {
      carregarLista();
      if (abertoId) abrir(abertoId);
    }, POLL_MS);
    return () => clearInterval(t);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [abertoId, aba, setor]);

  useEffect(() => {
    fimDaTimeline.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.messages?.length]);

  const departamentos = useMemo(() => overview?.departments ?? [], [overview]);
  const byDepartment = overview?.byDepartment ?? {};
  const semSetor = byDepartment.sem_departamento; // chamados que a triagem ainda não roteou

  // Recorte final da aba. "Tudo" no WhatsApp não mostra arquivadas; aqui o
  // equivalente é esconder o que já foi resolvido — senão a lista de trabalho
  // vira histórico e o atendente perde o fio.
  const visiveis = useMemo(() => {
    const fechado = (t) => t.status === "resolvido" || t.status === "encerrado";
    if (aba === "nao_lidos") return tickets.filter((t) => t.unreadCount > 0 && !fechado(t));
    if (aba === "fila") return tickets.filter((t) => !t.assigneeId && !fechado(t));
    if (aba === "tudo") return tickets.filter((t) => !fechado(t));
    return tickets; // "meus" e "resolvidos" já vêm recortados da API
  }, [tickets, aba]);

  const naoLidosTotal = useMemo(
    () => tickets.filter((t) => t.unreadCount > 0 && t.status !== "resolvido").length,
    [tickets]
  );
  const naFila = !ticket?.assigneeId;

  return (
    <AdminLayout>
      <TecBreadcrumb
        title="Suporte (Central IASO)"
        subtitle="Chamados das clínicas que chegam pelo WhatsApp da central, e quem está atendendo cada um."
      />

      <div className="flex justify-end gap-2 mb-4">
        {templates.length > 0 && (
          <button
            onClick={() => setNovaConversa(true)}
            className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl bg-[#00704A] text-white hover:opacity-90 transition"
          >
            <MessageSquarePlus size={13} /> Nova conversa
          </button>
        )}
        <button
          onClick={() => { setLoading(true); carregarLista(); }}
          disabled={loading}
          className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl border border-[#E6E2D8] text-gray-600 hover:border-[#00704A]/40 hover:text-[#00704A] transition disabled:opacity-50"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Atualizar
        </button>
      </div>

      {novaConversa && (
        <ModalNovaConversa
          templates={templates}
          onFechar={() => setNovaConversa(false)}
          onCriada={async (ticketId) => {
            setNovaConversa(false);
            await carregarLista();
            abrir(ticketId); // já cai dentro da conversa recém-criada
          }}
        />
      )}

      {err && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl px-5 py-4 text-sm flex items-center gap-2 mb-4">
          <AlertTriangle size={15} /> {err}
        </div>
      )}
      {aviso && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-2xl px-5 py-4 text-sm flex items-center gap-2 mb-4">
          <AlertTriangle size={15} /> {aviso}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_280px] gap-4 items-start">
        {/* ── Coluna 1: abas, setores e conversas ─────────────────────── */}
        <div className="bg-white rounded-2xl border border-[#E6E2D8] overflow-hidden">
          {/* Abas: o recorte de trabalho, como o "Tudo / Não lidas" do app. */}
          <div className="flex gap-1 px-2 pt-2.5 pb-2 border-b border-[#E6E2D8] overflow-x-auto">
            {ABAS.map((a) => {
              const ativa = aba === a.key;
              const badge = a.key === "nao_lidos" && naoLidosTotal > 0 ? naoLidosTotal : null;
              return (
                <button
                  key={a.key}
                  onClick={() => { setAba(a.key); setAbertoId(null); setTicket(null); }}
                  className={`shrink-0 text-[11px] font-semibold px-2.5 py-1.5 rounded-full transition ${
                    ativa
                      ? "bg-[#00704A] text-white"
                      : "text-gray-500 bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  {a.label}
                  {badge && (
                    <span className={ativa ? "ml-1 text-white/80" : "ml-1 text-[#00704A]"}>
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Setores. `abertos / total` — o total é o histórico acumulado,
              incluindo resolvidos. */}
          <div className="px-2 py-2 border-b border-[#E6E2D8]">
            <div className="flex gap-1 overflow-x-auto pb-0.5">
              <button
                onClick={() => { setSetor(""); setAbertoId(null); setTicket(null); }}
                className={`shrink-0 text-[11px] px-2.5 py-1 rounded-full border transition ${
                  !setor
                    ? "border-[#00704A]/40 text-[#00704A] bg-[#00704A]/5 font-semibold"
                    : "border-[#E6E2D8] text-gray-500 hover:border-[#00704A]/30"
                }`}
              >
                Todos
              </button>
              {departamentos.map((d) => {
                const ativo = setor === d.id;
                const stats = byDepartment[d.id];
                return (
                  <button
                    key={d.id}
                    onClick={() => { setSetor(ativo ? "" : d.id); setAbertoId(null); setTicket(null); }}
                    className={`shrink-0 text-[11px] px-2.5 py-1 rounded-full border transition ${
                      ativo
                        ? "border-[#00704A]/40 text-[#00704A] bg-[#00704A]/5 font-semibold"
                        : "border-[#E6E2D8] text-gray-500 hover:border-[#00704A]/30"
                    }`}
                    title={`${stats?.abertos ?? 0} em aberto · ${stats?.total ?? 0} no histórico`}
                  >
                    {d.name}
                    <span className="ml-1 tabular-nums text-gray-400">
                      {stats?.abertos ?? 0}/{stats?.total ?? 0}
                    </span>
                  </button>
                );
              })}
              {semSetor?.total > 0 && (
                <span
                  className="shrink-0 text-[11px] px-2.5 py-1 rounded-full border border-dashed border-[#E6E2D8] text-gray-400"
                  title="Chamados que a triagem ainda não roteou"
                >
                  Em triagem <span className="tabular-nums">{semSetor.total}</span>
                </span>
              )}
            </div>
          </div>

          {/* Conversas: cada linha é avatar + nome + prévia + hora. */}
          <div className="max-h-[520px] overflow-y-auto">
            {visiveis.length === 0 && !loading && (
              <div className="text-xs text-gray-400 px-3 py-10 text-center">
                {aba === "nao_lidos" ? "Nada sem ler por aqui." : "Nenhum chamado neste recorte."}
              </div>
            )}
            {visiveis.map((t) => {
              const nome = t.contact?.name || t.contact?.waName || telefoneBonito(t.contact?.phone);
              const naoLido = t.unreadCount > 0;
              const info = STATUS_INFO[t.status];
              return (
                <button
                  key={t.id}
                  onClick={() => abrir(t.id)}
                  className={`w-full text-left px-3 py-2.5 flex gap-2.5 items-start border-b border-[#F2EFE7] transition ${
                    abertoId === t.id ? "bg-[#00704A]/[0.07]" : "hover:bg-gray-50"
                  }`}
                >
                  <div
                    className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-[11px] font-bold text-white"
                    style={{ backgroundColor: corDoAvatar(t.contact?.phone || t.id) }}
                  >
                    {iniciais(nome)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className={`text-sm truncate ${naoLido ? "font-bold text-gray-900" : "font-medium text-gray-800"}`}>
                        {nome}
                      </span>
                      <span className={`text-[10px] shrink-0 ${naoLido ? "text-[#00704A] font-semibold" : "text-gray-400"}`}>
                        {horaCurta(t.lastMessageAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <span className={`text-xs truncate ${naoLido ? "text-gray-700" : "text-gray-400"}`}>
                        {t.lastPreview || "—"}
                      </span>
                      {naoLido && (
                        <span className="shrink-0 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold text-white bg-[#00704A] rounded-full">
                          {t.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] text-gray-300">#{t.number}</span>
                      {info && <Pill color={info.color}>{info.label}</Pill>}
                      {/* Janela fechada some da lista: o normal é estar aberta,
                          e marcar todas poluiria. O que precisa saltar aos
                          olhos é a conversa em que NÃO dá para escrever. */}
                      {(() => {
                        const j = janelaInfo(t.window);
                        if (!j || j.open) return null;
                        return <Pill color={j.color}>{j.curto}</Pill>;
                      })()}
                      {t.department?.name && (
                        <span className="text-[10px] text-gray-400 truncate">{t.department.name}</span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Coluna 2: conversa ──────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-[#E6E2D8] flex flex-col min-h-[560px]">
          {!ticket ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-300 py-20">
              <Inbox size={40} />
              <p className="text-sm mt-3 text-gray-400">Escolha um chamado para começar.</p>
            </div>
          ) : (
            <>
              <div className="border-b border-[#E6E2D8] px-5 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold text-gray-800 truncate">
                    {ticket.contact?.name || ticket.contact?.waName || telefoneBonito(ticket.contact?.phone)}
                  </div>
                  <div className="text-[11px] text-gray-400 flex items-center gap-1.5">
                    <span>#{ticket.number} · {ticket.department?.name ?? "sem departamento"}</span>
                    {(() => {
                      const j = janelaInfo(ticket.window);
                      if (!j) return null;
                      return (
                        <span title={`${j.titulo}. ${j.detalhe}`}>
                          <Pill color={j.color}>{j.curto}</Pill>
                        </span>
                      );
                    })()}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {naFila ? (
                    <button
                      onClick={() => agir("claim")}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-[#00704A] text-white hover:opacity-90 transition"
                    >
                      <UserPlus size={13} /> Assumir
                    </button>
                  ) : (
                    <Pill color="#00704A">Em atendimento</Pill>
                  )}
                  {ticket.status !== "resolvido" ? (
                    <button
                      onClick={() => agir("resolve", { reason: "resolvido pelo atendente" })}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-[#E6E2D8] text-gray-600 hover:border-[#00704A]/40 hover:text-[#00704A] transition"
                    >
                      <CheckCircle2 size={13} /> Resolver
                    </button>
                  ) : (
                    <button
                      onClick={() => agir("reopen")}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-[#E6E2D8] text-gray-600 hover:border-[#00704A]/40 hover:text-[#00704A] transition"
                    >
                      <RotateCcw size={13} /> Reabrir
                    </button>
                  )}
                </div>
              </div>

              {/* Timeline. Nota interna divide a mesma lista das mensagens, mas
                  fica visualmente distinta — ela nunca chega ao cliente. */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 max-h-[420px]">
                {(ticket.messages ?? []).length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-10">Nenhuma mensagem ainda.</p>
                )}
                {(ticket.messages ?? []).map((m) => {
                  if (m.isInternalNote) {
                    return (
                      <div key={m.id} className="flex justify-center">
                        <div className="max-w-[85%] bg-[#FDF6E3] border border-[#E9DDBF] rounded-xl px-3 py-2">
                          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#8A6D3B] mb-1">
                            <StickyNote size={11} /> Nota interna · só a equipe vê
                          </div>
                          <div className="text-xs text-[#6B5426] whitespace-pre-wrap">{m.text}</div>
                        </div>
                      </div>
                    );
                  }
                  const meu = m.direction === "outbound";
                  return (
                    <div key={m.id} className={`flex ${meu ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[75%] rounded-2xl px-3.5 py-2 ${
                          meu ? "bg-[#00704A] text-white" : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        <Anexo m={m} meu={meu} />
                        {m.text && (
                          <div className="text-sm whitespace-pre-wrap">{m.text}</div>
                        )}
                        {!m.text && !m.mediaUrl && (
                          <div className="text-sm whitespace-pre-wrap">{resumoSemTexto(m.kind)}</div>
                        )}
                        <div className={`text-[10px] mt-1 ${meu ? "text-white/70" : "text-gray-400"}`}>
                          {horaCurta(m.createdAt)}
                          {m.authorKind === "automation" && " · automático"}
                          {/* Modelo aprovado não é o atendente escrevendo: marcar
                              explica por que o texto tem cara de padrão. */}
                          {m.kind === "template" && " · modelo"}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={fimDaTimeline} />
              </div>

              {/* Responder ao cliente pelo número da central.
                  Com a janela fechada a caixa dá lugar ao aviso: deixá-la
                  disponível só faria o atendente escrever para descobrir no
                  envio que a Meta recusou. */}
              <div className="border-t border-[#E6E2D8] px-5 py-3 space-y-2">
                {(() => {
                  const j = janelaInfo(ticket.window);
                  if (j && !j.open) {
                    return (
                      <div className="bg-[#FDF6E3] border border-[#E9DDBF] rounded-xl px-3.5 py-3 flex items-start gap-2.5">
                        <Lock size={14} className="text-[#8A6D3B] shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-[#8A6D3B]">{j.titulo}</div>
                          <div className="text-[11px] text-[#6B5426] mt-0.5">{j.detalhe}</div>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <form
                      onSubmit={enviarResposta}
                      className="flex items-center gap-2 bg-white border border-[#E6E2D8] rounded-xl px-3 py-2.5 focus-within:border-[#00704A] transition"
                    >
                      <input
                        value={resposta}
                        onChange={(e) => setResposta(e.target.value)}
                        disabled={enviando}
                        placeholder="Responder ao cliente pelo WhatsApp"
                        className="flex-1 bg-transparent text-sm outline-none disabled:opacity-50"
                      />
                      <button
                        type="submit"
                        disabled={!resposta.trim() || enviando}
                        className="shrink-0 disabled:opacity-30 transition"
                        title="Enviar"
                      >
                        <Send size={16} className={enviando ? "text-gray-300" : "text-[#00704A]"} />
                      </button>
                    </form>
                  );
                })()}

                <form onSubmit={salvarNota} className="flex items-center gap-2">
                  <StickyNote size={13} className="text-[#CBA258] shrink-0" />
                  <input
                    value={nota}
                    onChange={(e) => setNota(e.target.value)}
                    placeholder="Escrever nota interna (o cliente não vê)"
                    className="flex-1 text-sm border border-[#E6E2D8] rounded-xl px-3 py-2 outline-none focus:border-[#CBA258] transition"
                  />
                  <button
                    type="submit"
                    disabled={!nota.trim()}
                    className="text-xs font-semibold px-3 py-2 rounded-xl bg-[#CBA258] text-white disabled:opacity-40 transition"
                  >
                    Salvar
                  </button>
                </form>
              </div>
            </>
          )}
        </div>

        {/* ── Coluna 3: contexto do contato ───────────────────────────── */}
        <div className="bg-white rounded-2xl border border-[#E6E2D8] p-5">
          <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Contato
          </div>
          {!ticket ? (
            <p className="text-xs text-gray-400">Nenhum chamado aberto.</p>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="font-semibold text-gray-800">
                  {ticket.contact?.name || ticket.contact?.waName || "Sem nome"}
                </div>
                <div className="text-xs text-gray-500 flex items-center gap-1.5 mt-1">
                  <Phone size={12} /> {telefoneBonito(ticket.contact?.phone)}
                </div>
              </div>

              <div className="border-t border-[#E6E2D8] pt-3 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Cliente IASO</span>
                  <span className="text-gray-700 flex items-center gap-1">
                    <Building2 size={12} />
                    {ticket.contact?.clinicId ? "identificado" : "não identificado"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Abertura</span>
                  <span className="text-gray-700">{horaCurta(ticket.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">1ª resposta</span>
                  <span className="text-gray-700 flex items-center gap-1">
                    <Clock size={12} />
                    {ticket.firstReplyAt ? horaCurta(ticket.firstReplyAt) : "pendente"}
                  </span>
                </div>
              </div>

              {/* Transferir para departamento devolve o chamado à fila —
                  é como o atendente passa adiante o que não é dele. */}
              <div className="border-t border-[#E6E2D8] pt-3">
                <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <ArrowRightLeft size={11} /> Transferir para
                </div>
                <div className="space-y-1">
                  {departamentos.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => agir("transfer", { toDeptId: d.id })}
                      disabled={ticket.departmentId === d.id}
                      className="w-full text-left text-xs px-3 py-2 rounded-xl border border-[#E6E2D8] text-gray-600 hover:border-[#00704A]/40 hover:text-[#00704A] transition disabled:opacity-40 disabled:hover:border-[#E6E2D8] disabled:hover:text-gray-600"
                    >
                      {d.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
