import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";

import { cn } from "@/lib/utils";

/**
 * Controles de toque do "Operação: Plantão": joystick analógico e botões que
 * ficam apertados enquanto o dedo está sobre eles. Ficam sempre em cantos da
 * tela, nunca por cima da área onde o jogo acontece.
 */

export function Joystick({
  saida,
  className,
}: {
  saida: RefObject<{ dx: number; dy: number }>;
  className?: string;
}) {
  const base = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const ativo = useRef<number | null>(null);

  const mover = (e: React.PointerEvent) => {
    const el = base.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const raio = r.width / 2;
    let dx = (e.clientX - (r.left + raio)) / raio;
    let dy = (e.clientY - (r.top + raio)) / raio;
    const len = Math.hypot(dx, dy);
    if (len > 1) {
      dx /= len;
      dy /= len;
    }
    saida.current.dx = Math.abs(dx) < 0.12 ? 0 : dx;
    saida.current.dy = Math.abs(dy) < 0.12 ? 0 : dy;
    setKnob({ x: dx * raio * 0.5, y: dy * raio * 0.5 });
  };
  const soltar = () => {
    ativo.current = null;
    saida.current.dx = 0;
    saida.current.dy = 0;
    setKnob({ x: 0, y: 0 });
  };

  return (
    <div
      ref={base}
      role="application"
      aria-label="Direção: arraste para andar"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        ativo.current = e.pointerId;
        mover(e);
      }}
      onPointerMove={(e) => {
        if (ativo.current === e.pointerId) mover(e);
      }}
      onPointerUp={soltar}
      onPointerCancel={soltar}
      onContextMenu={(e) => e.preventDefault()}
      className={cn(
        "relative touch-none select-none rounded-full border-2 border-white/35 bg-slate-950/45 backdrop-blur",
        className,
      )}
    >
      {[
        "top-1.5 left-1/2 -translate-x-1/2",
        "bottom-1.5 left-1/2 -translate-x-1/2",
        "left-1.5 top-1/2 -translate-y-1/2",
        "right-1.5 top-1/2 -translate-y-1/2",
      ].map((p) => (
        <span key={p} className={cn("absolute size-1.5 rounded-full bg-white/40", p)} />
      ))}
      <div
        className="absolute left-1/2 top-1/2 size-[46%] rounded-full border-2 border-white/70 bg-white/25 shadow-lg"
        style={{ transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` }}
      />
    </div>
  );
}

export function BotaoToque({
  rotulo,
  aoApertar,
  aoSoltar,
  className,
  children,
  pulsando,
}: {
  rotulo: string;
  aoApertar: () => void;
  aoSoltar?: () => void;
  className?: string;
  children: ReactNode;
  pulsando?: boolean;
}) {
  const [aceso, setAceso] = useState(false);
  const solta = () => {
    setAceso(false);
    aoSoltar?.();
  };
  return (
    <button
      type="button"
      aria-label={rotulo}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        setAceso(true);
        aoApertar();
      }}
      onPointerUp={solta}
      onPointerCancel={solta}
      onLostPointerCapture={solta}
      onContextMenu={(e) => e.preventDefault()}
      className={cn(
        "flex cursor-pointer touch-none select-none flex-col items-center justify-center rounded-full border-2 text-[10px] font-black uppercase leading-tight text-white shadow-lg backdrop-blur transition-transform",
        aceso ? "scale-90 border-white bg-white/40" : "border-white/45 bg-slate-950/50",
        pulsando && !aceso && "animate-pulse border-amber-300 bg-amber-500/50",
        className,
      )}
    >
      {children}
    </button>
  );
}

/** Detecta aparelho de toque (celular/tablet) e orientação vertical. */
export function useAparelho() {
  const [info, setInfo] = useState({ toque: false, retrato: false });
  useEffect(() => {
    const tq = window.matchMedia("(pointer: coarse)");
    const or = window.matchMedia("(orientation: portrait)");
    const atualizar = () =>
      setInfo({ toque: tq.matches || window.innerWidth < 720, retrato: or.matches });
    atualizar();
    tq.addEventListener("change", atualizar);
    or.addEventListener("change", atualizar);
    window.addEventListener("resize", atualizar);
    return () => {
      tq.removeEventListener("change", atualizar);
      or.removeEventListener("change", atualizar);
      window.removeEventListener("resize", atualizar);
    };
  }, []);
  return info;
}
