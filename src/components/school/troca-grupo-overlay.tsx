import { RefreshCcw, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { playAlertaTroca } from "@/lib/alert-sound";

export interface TrocaGrupoOverlayProps {
  /** Muda sempre que o grupo da vez muda (ex.: "2025-05-03|08:30"). */
  chave: string;
  /** Número do grupo que assume agora (1-based). */
  proximoGrupo?: number | undefined;
  /** Toca os bipes junto com o aviso visual. */
  comSom?: boolean;
  /** Segundos que o aviso fica na tela antes de sumir sozinho. */
  duracaoSegundos?: number;
}

/**
 * Aviso visual grande, em tela cheia, quando o tempo do grupo termina.
 * Só dispara em trocas ocorridas com a tela já aberta (nunca na primeira
 * renderização), para não "piscar" ao carregar a página.
 */
export function TrocaGrupoOverlay({
  chave,
  proximoGrupo,
  comSom = false,
  duracaoSegundos = 20,
}: TrocaGrupoOverlayProps) {
  const [visivel, setVisivel] = useState(false);
  const chaveAnterior = useRef<string | null>(null);

  useEffect(() => {
    // Só avisa em trocas reais entre dois blocos de aula: chave vazia
    // significa "nenhuma aula agora", e não deve disparar o aviso.
    if (chave && chaveAnterior.current && chaveAnterior.current !== chave) {
      setVisivel(true);
      if (comSom) playAlertaTroca();
    }
    chaveAnterior.current = chave;
  }, [chave, comSom]);

  useEffect(() => {
    if (!visivel) return;
    const id = window.setTimeout(() => setVisivel(false), duracaoSegundos * 1000);
    return () => window.clearTimeout(id);
  }, [visivel, duracaoSegundos]);

  if (!visivel) return null;

  return (
    <div
      role="alertdialog"
      aria-label="Trocar grupo"
      className="fixed inset-0 z-100 flex flex-col items-center justify-center gap-6 bg-destructive/95 p-6 text-center backdrop-blur-sm"
    >
      <RefreshCcw className="size-20 animate-spin text-white [animation-duration:3s]" />
      <p className="animate-pulse text-6xl font-black uppercase tracking-tight text-white sm:text-8xl">
        Trocar grupo
      </p>
      {proximoGrupo ? (
        <p className="text-2xl font-semibold text-white/90 sm:text-4xl">
          Agora é a vez do grupo {proximoGrupo}
        </p>
      ) : (
        <p className="text-2xl font-semibold text-white/90 sm:text-4xl">Tempo encerrado</p>
      )}
      <Button
        type="button"
        size="lg"
        variant="secondary"
        onClick={() => setVisivel(false)}
        className="mt-4"
      >
        <X className="size-5" /> Fechar aviso
      </Button>
    </div>
  );
}
