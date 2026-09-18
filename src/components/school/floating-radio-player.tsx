import { AlertTriangle, Antenna, Loader2, Pause, Play, Radio, Volume1, Volume2, VolumeX, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

const ESTACAO = {
  nome: "Groove Salad",
  emissora: "SomaFM",
  genero: "Ambiente / Downtempo",
  streamUrl: "https://ice1.somafm.com/groovesalad-128-mp3",
  paginaUrl: "https://somafm.com/groovesalad/",
};

const VOLUME_KEY = "informatica:radio-volume";

type Status = "parado" | "carregando" | "tocando" | "erro";

function readVolumeInicial(): number {
  if (typeof window === "undefined") return 0.6;
  const salvo = Number(window.localStorage.getItem(VOLUME_KEY));
  return Number.isFinite(salvo) && salvo >= 0 && salvo <= 1 ? salvo : 0.6;
}

/** Barrinhas de VU-meter, só animadas de verdade quando a rádio está tocando. */
function Equalizador({ ativo }: { ativo: boolean }) {
  const atrasos = [0, 0.15, 0.3, 0.1, 0.25];
  return (
    <div className="flex h-5 items-end gap-[3px]" aria-hidden>
      {atrasos.map((atraso, i) => (
        <span
          key={i}
          className={cn(
            "w-[3px] rounded-full bg-gradient-to-t from-emerald-400 to-lime-300",
            ativo ? "" : "h-[3px] scale-y-100 opacity-40",
          )}
          style={
            ativo
              ? {
                  height: "20px",
                  animation: `radio-eq-bar ${0.6 + atraso}s ease-in-out ${atraso}s infinite`,
                }
              : undefined
          }
        />
      ))}
    </div>
  );
}

/**
 * Rádio ambiente flutuante, com visual de aparelho físico (grade de
 * alto-falante, LED, VU-meter animado): toca uma estação instrumental
 * gratuita (SomaFM) de fundo, útil como música ambiente durante o uso do
 * laboratório. Fica montada uma única vez no root, então a música não para
 * ao navegar entre páginas.
 */
export function FloatingRadioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [status, setStatus] = useState<Status>("parado");
  const [aberto, setAberto] = useState(false);
  const [volume, setVolume] = useState(readVolumeInicial);
  const [mudo, setMudo] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = mudo ? 0 : volume;
  }, [volume, mudo]);

  function alternarReproducao() {
    const audio = audioRef.current;
    if (!audio) return;
    if (status === "tocando") {
      audio.pause();
      setStatus("parado");
      return;
    }
    setStatus("carregando");
    audio.play().catch(() => setStatus("erro"));
  }

  const VolumeIcon = mudo || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      <audio
        ref={audioRef}
        src={ESTACAO.streamUrl}
        preload="none"
        onWaiting={() => setStatus("carregando")}
        onPlaying={() => setStatus("tocando")}
        onPause={() => setStatus((s) => (s === "erro" ? s : "parado"))}
        onError={() => setStatus("erro")}
      />

      {aberto ? (
        <div className="w-72 overflow-hidden rounded-2xl border border-neutral-700/60 bg-gradient-to-b from-neutral-800 to-neutral-950 text-neutral-100 shadow-2xl ring-1 ring-black/40">
          {/* Topo: LED, marca e fechar */}
          <div className="flex items-center justify-between border-b border-white/10 bg-black/30 px-3 py-2">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "size-2 rounded-full",
                  status === "tocando"
                    ? "bg-emerald-400 shadow-[0_0_6px_2px] shadow-emerald-400/70"
                    : status === "erro"
                      ? "bg-red-500"
                      : "bg-neutral-500",
                )}
              />
              <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-widest text-neutral-300">
                <Radio className="size-3.5" /> Rádio ambiente
              </span>
            </div>
            <button
              type="button"
              onClick={() => setAberto(false)}
              aria-label="Fechar rádio"
              className="text-neutral-400 hover:text-neutral-100"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Visor tipo "display" do aparelho */}
          <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-black/40 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate font-mono text-sm font-semibold text-lime-300">
                {ESTACAO.emissora} · {ESTACAO.nome}
              </p>
              <p className="truncate text-[11px] text-neutral-400">
                {status === "erro"
                  ? "Sinal indisponível no momento"
                  : status === "carregando"
                    ? "Sintonizando..."
                    : ESTACAO.genero}
              </p>
            </div>
            <Equalizador ativo={status === "tocando"} />
          </div>

          {/* Controles */}
          <div className="flex flex-col gap-3 px-4 py-3">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                size="icon"
                onClick={alternarReproducao}
                aria-label={status === "tocando" ? "Pausar rádio" : "Tocar rádio"}
                className="size-11 shrink-0 rounded-full bg-gradient-to-b from-emerald-400 to-emerald-600 text-emerald-950 shadow-lg hover:from-emerald-300 hover:to-emerald-500"
              >
                {status === "carregando" ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : status === "tocando" ? (
                  <Pause className="size-5" />
                ) : (
                  <Play className="size-5 translate-x-0.5" />
                )}
              </Button>

              <div className="flex flex-1 items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMudo((m) => !m)}
                  aria-label={mudo ? "Ativar som" : "Silenciar"}
                  className="text-neutral-300 hover:text-neutral-100"
                >
                  <VolumeIcon className="size-4" />
                </button>
                <Slider
                  value={[mudo ? 0 : volume * 100]}
                  max={100}
                  step={1}
                  onValueChange={([v]) => {
                    setMudo(false);
                    const novoVolume = (v ?? 0) / 100;
                    setVolume(novoVolume);
                    window.localStorage.setItem(VOLUME_KEY, String(novoVolume));
                  }}
                  className="flex-1"
                />
              </div>
            </div>

            {status === "erro" ? (
              <p className="flex items-center gap-1.5 text-[11px] text-amber-400">
                <AlertTriangle className="size-3.5" /> Não foi possível conectar à rádio agora.
                Tente novamente.
              </p>
            ) : (
              <a
                href={ESTACAO.paginaUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-[11px] text-neutral-500 hover:text-neutral-300"
              >
                <Antenna className="size-3" /> Transmissão via {ESTACAO.emissora}
              </a>
            )}
          </div>
        </div>
      ) : (
        <Button
          type="button"
          onClick={() => setAberto(true)}
          aria-label="Abrir rádio ambiente"
          className={cn(
            "flex size-14 items-center justify-center rounded-full bg-gradient-to-b from-neutral-800 to-neutral-950 text-emerald-300 shadow-2xl ring-1 ring-black/40 hover:from-neutral-700 hover:to-neutral-900",
            status === "tocando" && "ring-2 ring-emerald-400/60",
          )}
        >
          {status === "tocando" ? (
            <Equalizador ativo />
          ) : (
            <Radio className="size-6" />
          )}
        </Button>
      )}
    </div>
  );
}
