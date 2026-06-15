import { useRef, useState } from "react";
import Avatar from "./Avatar";

function normStr(s) {
  return String(s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export default function MentionTextarea({ value, onChange, onBlur, onEnter, team = [], placeholder, rows = 2, className = "", style }) {
  const ref = useRef();
  const [mention, setMention] = useState(null); // { query, start }

  function handleChange(e) {
    const val    = e.target.value;
    const cursor = e.target.selectionStart;
    const before = val.slice(0, cursor);
    const match  = before.match(/@([\wÀ-ÿ]*)$/);
    setMention(match ? { query: match[1], start: match.index } : null);
    onChange?.(val);
  }

  function insertMention(name) {
    if (mention === null) return;
    const cursor = ref.current.selectionStart;
    const before = value.slice(0, mention.start);
    const after  = value.slice(cursor);
    const next   = `${before}@${name} ${after}`;
    onChange?.(next);
    setMention(null);
    setTimeout(() => {
      const pos = mention.start + name.length + 2; // @Name + space
      ref.current.setSelectionRange(pos, pos);
      ref.current.focus();
    }, 0);
  }

  const suggestions = mention
    ? team.filter((m) => normStr(m.name).startsWith(normStr(mention.query)))
    : [];

  function handleKeyDown(e) {
    if (suggestions.length > 0) {
      if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); insertMention(suggestions[0].name); return; }
      if (e.key === "Escape") { setMention(null); return; }
    }
    if (e.key === "Enter" && !e.shiftKey && suggestions.length === 0) {
      onEnter?.(e);
    }
  }

  // Render @Name spans inside value for display — we use a simple highlight overlay approach
  // For simplicity, we just render plain textarea + dropdown
  return (
    <div className="relative">
      {suggestions.length > 0 && (
        <div className="absolute bottom-full left-0 mb-1 bg-white border border-[#E8E0D2] rounded-xl shadow-lg z-20 min-w-44 overflow-hidden">
          {suggestions.map((m) => (
            <button
              key={m.id}
              onMouseDown={(e) => { e.preventDefault(); insertMention(m.name); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[#F5F1EA] transition text-left"
            >
              <Avatar name={m.name} size={5} />
              <span className="font-medium text-[#1F4D46]">{m.name}</span>
            </button>
          ))}
        </div>
      )}
      <textarea
        ref={ref}
        value={value ?? ""}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={() => { setMention(null); onBlur?.(); }}
        placeholder={placeholder}
        rows={rows}
        className={className}
        style={style}
      />
    </div>
  );
}
