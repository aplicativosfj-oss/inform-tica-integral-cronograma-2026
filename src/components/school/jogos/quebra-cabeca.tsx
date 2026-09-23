import { useEffect, useRef, useState } from "react";

import { PALAVRAS } from "@/components/school/ferramentas/alfabeto-dados";
import { Figura } from "@/components/school/ferramentas/figuras-alfabeto";
import { registrarPartida, type Adversario } from "@/lib/estrelas";
import { falar } from "@/lib/voz";
import { cn } from "@/lib/utils";

/**
 * Quebra-cabeça deslizante: a figura é cortada em pedaços e um deles sai,
 * deixando o buraco por onde os outros andam. É o quebra-cabeça de plástico
 * que cabe no bolso.
 *
 * O desenho é o mesmo SVG do Parque das Letras, recortado por CSS: cada peça
 * mostra só o seu pedaço da imagem. Assim qualquer uma das 69 figuras vira
 * quebra-cabeça sem precisar de arquivo de imagem nenhum.
 *
 * O embaralhamento é feito dando muitos passos legais a partir da figura
 * montada — nunca sorteando as peças de qualquer jeito. Sorteio ao acaso
 * produz tabuleiro impossível na metade das vezes, e criança não tem como
 * saber que o problema não era ela.
 */

const TAMANHOS = [
  { lado: 3, nome: "3 × 3" },
  { lado: 4, nome: "4 × 4" },
  { lado: 5, nome: "5 × 5" },
];

/** Tamanho do quebra-cabeça: cabe na tela do aparelho, entre 240 e 460 pixels. */
function ladoInicial(): number {
  if (typeof window === "undefined") return 270;
  return Math.round(Math.max(240, Math.min(460, window.innerWidth - 56, window.innerHeight - 300)));
}

function vizinhas(i: number, lado: number): number[] {
  const l = Math.floor(i / lado);
  const c = i % lado;
  const v: number[] = [];
  if (l > 0) v.push(i - lado);
  if (l < lado - 1) v.push(i + lado);
  if (c > 0) v.push(i - 1);
  if (c < lado - 1) v.push(i + 1);
  return v;
}

function embaralharLegal(lado: number): number[] {
  const n = lado * lado;
  const pecas = Array.from({ length: n }, (_, i) => i);
  let vazio = n - 1;
  let anterior = -1;
  for (let k = 0; k < n * 40; k++) {
    const opcoes = vizinhas(vazio, lado).filter((v) => v !== anterior);
    const escolhida = opcoes[Math.floor(Math.random() * opcoes.length)]!;
    [pecas[vazio], pecas[escolhida]] = [pecas[escolhida]!, pecas[vazio]!];
    anterior = vazio;
    vazio = escolhida;
  }
  return pecas;
}

export function QuebraCabeca({ adversario, nivel }: { adversario: Adversario; nivel: number }) {
  const config = TAMANHOS[Math.min(nivel, TAMANHOS.length) - 1] ?? TAMANHOS[0]!;
  const lado = config.lado;
  const total = lado * lado;

  const [palavra, setPalavra] = useState(
    () => PALAVRAS[Math.floor(Math.random() * PALAVRAS.length)]!,
  );
  const [pecas, setPecas] = useState<number[]>(() => embaralharLegal(lado));
  const [movimentos, setMovimentos] = useState(0);
  const [verModelo, setVerModelo] = useState(false);
  const [estrelas, setEstrelas] = useState<number | null>(null);
  const inicio = useRef(Date.now());

  const pronto = pecas.every((p, i) => p === i);
  const [LADO_PX] = useState(ladoInicial);
  const tamPeca = LADO_PX / lado;
  const arraste = useRef<{ pos: number; x: number; y: number; moveu: boolean } | null>(null);
  const [puxando, setPuxando] = useState<{ pos: number; dx: number; dy: number } | null>(null);
  const ignorarClique = useRef(false);

  function mover(pos: number) {
    if (pronto) return;
    const vazio = pecas.indexOf(total - 1);
    if (!vizinhas(vazio, lado).includes(pos)) return;
    setPecas((ps) => {
      const novo = [...ps];
      [novo[vazio], novo[pos]] = [novo[pos]!, novo[vazio]!];
      return novo;
    });
    setMovimentos((m) => m + 1);
  }

  useEffect(() => {
    if (!pronto || estrelas !== null || movimentos === 0) return;
    falar(`Muito bem! ${palavra.texto}`);
    const segundos = Math.round((Date.now() - inicio.current) / 1000);
    void registrarPartida({
      jogo: "quebra-cabeca",
      titulo: "Quebra-cabeça",
      resultado: "vitoria",
      adversario,
      nivel,
      segundos,
    }).then(setEstrelas);
  }, [pronto, estrelas, movimentos, palavra.texto, adversario, nivel]);

  function novaPartida() {
    setPalavra(PALAVRAS[Math.floor(Math.random() * PALAVRAS.length)]!);
    setPecas(embaralharLegal(lado));
    setMovimentos(0);
    setEstrelas(null);
    inicio.current = Date.now();
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm font-semibold text-foreground">
        {pronto && movimentos > 0
          ? `Pronto! Era ${palavra.texto}, em ${movimentos} movimentos.`
          : "Arraste (ou toque) as peças para montar a figura"}
      </p>

      <div
        className="relative overflow-hidden rounded-2xl border-4 border-border bg-muted/40"
        style={{ width: LADO_PX, height: LADO_PX }}
      >
        {pecas.map((peca, pos) => {
          const vazia = peca === total - 1 && !pronto;
          const linhaOrig = Math.floor(peca / lado);
          const colOrig = peca % lado;
          return (
            <button
              key={pos}
              type="button"
              onClick={() => {
                if (ignorarClique.current) {
                  ignorarClique.current = false;
                  return;
                }
                mover(pos);
              }}
              onPointerDown={(e) => {
                if (vazia || pronto) return;
                e.currentTarget.setPointerCapture(e.pointerId);
                arraste.current = { pos, x: e.clientX, y: e.clientY, moveu: false };
              }}
              onPointerMove={(e) => {
                const a = arraste.current;
                if (!a || a.pos !== pos) return;
                const dx = e.clientX - a.x;
                const dy = e.clientY - a.y;
                if (Math.hypot(dx, dy) > 6) a.moveu = true;
                // A peça só acompanha o dedo na direção do espaço vazio, e no máximo uma peça.
                const vazioPos = pecas.indexOf(total - 1);
                const alvoX = ((vazioPos % lado) - (pos % lado)) * tamPeca;
                const alvoY = (Math.floor(vazioPos / lado) - Math.floor(pos / lado)) * tamPeca;
                const ehVizinha = vizinhas(vazioPos, lado).includes(pos);
                const lim = (v: number, alvo: number) =>
                  ehVizinha && alvo !== 0
                    ? Math.max(Math.min(v, Math.max(alvo, 0)), Math.min(alvo, 0))
                    : 0;
                setPuxando({ pos, dx: lim(dx, alvoX), dy: lim(dy, alvoY) });
              }}
              onPointerUp={(e) => {
                const a = arraste.current;
                arraste.current = null;
                setPuxando(null);
                if (!a || !(a.moveu || Math.hypot(e.clientX - a.x, e.clientY - a.y) > 6)) return;
                ignorarClique.current = true;
                const dx = e.clientX - a.x;
                const dy = e.clientY - a.y;
                if (Math.hypot(dx, dy) > tamPeca * 0.3) mover(pos);
              }}
              onPointerCancel={() => {
                arraste.current = null;
                setPuxando(null);
              }}
              aria-label={vazia ? "Espaço vazio" : `Peça ${peca + 1}`}
              className={cn(
                "absolute touch-none overflow-hidden",
                puxando?.pos === pos ? "z-10 shadow-xl" : "transition-all duration-150",
                vazia ? "bg-muted/60" : "cursor-pointer border border-white/40",
              )}
              style={{
                width: tamPeca,
                height: tamPeca,
                left: (pos % lado) * tamPeca + (puxando?.pos === pos ? puxando.dx : 0),
                top: Math.floor(pos / lado) * tamPeca + (puxando?.pos === pos ? puxando.dy : 0),
              }}
            >
              {!vazia && (
                <span
                  className="pointer-events-none block"
                  style={{
                    width: tamPeca,
                    height: tamPeca,
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  {/* A figura inteira é desenhada dentro da peça e deslocada:
                    o que aparece é só o pedaço certo dela. */}
                  <span
                    style={{
                      position: "absolute",
                      left: -colOrig * tamPeca,
                      top: -linhaOrig * tamPeca,
                    }}
                  >
                    <Figura nome={palavra.figura} tamanho={LADO_PX} titulo={palavra.texto} />
                  </span>
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground">{movimentos} movimentos</span>
        <button
          type="button"
          onMouseDown={() => setVerModelo(true)}
          onMouseUp={() => setVerModelo(false)}
          onMouseLeave={() => setVerModelo(false)}
          onTouchStart={() => setVerModelo(true)}
          onTouchEnd={() => setVerModelo(false)}
          className="h-9 cursor-pointer rounded-lg border-2 border-border px-3 text-xs font-semibold text-foreground"
        >
          Segure para espiar
        </button>
      </div>

      {verModelo && (
        <div className="rounded-xl border-2 border-primary bg-card p-2">
          <Figura nome={palavra.figura} tamanho={110} titulo={palavra.texto} />
          <p className="text-center text-sm font-bold text-foreground">{palavra.texto}</p>
        </div>
      )}

      {estrelas !== null && estrelas > 0 && (
        <p className="text-sm font-bold text-amber-600 dark:text-amber-400">
          {"⭐".repeat(estrelas)} +{estrelas} {estrelas === 1 ? "estrela" : "estrelas"}
        </p>
      )}

      {pronto && movimentos > 0 && (
        <button
          type="button"
          onClick={novaPartida}
          className="h-11 cursor-pointer rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground"
        >
          Outra figura
        </button>
      )}
    </div>
  );
}
