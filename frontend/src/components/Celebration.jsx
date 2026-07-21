import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

// Overlay de positividade ao concluir uma task — confete CSS puro, sem dependências.
const COLORS = ["#00704A", "#CBA258", "#34D399", "#FBBF24", "#60A5FA", "#F472B6"];

export default function Celebration({ show, message = "Concluído! 🎉", onDone }) {
  const [pieces] = useState(() =>
    Array.from({ length: 80 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.4,
      duration: 1.6 + Math.random() * 1.2,
      color: COLORS[i % COLORS.length],
      size: 6 + Math.random() * 8,
      rotate: Math.random() * 360,
    }))
  );

  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => onDone?.(), 2200);
    return () => clearTimeout(t);
  }, [show, onDone]);

  if (!show) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10000] pointer-events-none overflow-hidden">
      <style>{`
        @keyframes iaso-fall {
          0%   { transform: translateY(-10vh) rotate(0deg);   opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0.9; }
        }
        @keyframes iaso-pop {
          0%   { transform: scale(0.6); opacity: 0; }
          40%  { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {pieces.map((p) => (
        <span
          key={p.id}
          style={{
            position: "absolute",
            top: "-5vh",
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.4,
            background: p.color,
            borderRadius: 2,
            transform: `rotate(${p.rotate}deg)`,
            animation: `iaso-fall ${p.duration}s ${p.delay}s ease-in forwards`,
          }}
        />
      ))}

      <div className="absolute inset-0 flex items-center justify-center">
        <div
          style={{ animation: "iaso-pop 0.4s ease-out forwards" }}
          className="bg-white/95 backdrop-blur border border-[#E6E2D8] shadow-2xl rounded-2xl px-8 py-5 text-center"
        >
          <p className="text-3xl mb-1">🎉</p>
          <p className="text-lg font-black text-[#00704A]">{message}</p>
        </div>
      </div>
    </div>,
    document.body
  );
}
