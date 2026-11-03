import { useEffect, useMemo, useRef, useState } from "react";

import {
  estadoDaSessao,
  hojeNaEscola,
  nomeExibido,
  useAgora,
  type SessaoLab,
} from "@/lib/laboratorio";

/** Cor de cada série (1º ao 5º ano), para o pontinho e as linhas da turma. */
const COR_SERIE = ["#38bdf8", "#a78bfa", "#34d399", "#fbbf24", "#fb7185"];
/** Turmas com até esta distância (px) entre dois colegas ganham uma linha ligando os dois. */
const ALCANCE = 300;
const MAX_NOMES = 14;
/** O que os nomes contornam: título, textos, botões, painel ao vivo. */
const OBSTACULOS =
  ".home-hero-entrance, .home-live-frame, .home-hero-stats, [data-constelacao-evitar]";
const FOLGA = 12;

interface Caixa {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Estrela {
  chave: string;
  nome: string;
  turma: string;
  cor: string;
  vivo: boolean;
}

interface Corpo {
  x: number;
  y: number;
  vx: number;
  vy: number;
  fase: number;
}

function corDaTurma(rotulo: string) {
  const n = Number(rotulo.match(/\d+/)?.[0]);
  return COR_SERIE[(Number.isFinite(n) ? n - 1 : 0) % COR_SERIE.length]!;
}

/** Número pseudoaleatório estável a partir de um texto, para cada nome nascer sempre no mesmo lugar. */
function semente(texto: string) {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) h = Math.imul(h ^ texto.charCodeAt(i), 16777619);
  return ((h >>> 0) % 10_000) / 10_000;
}

/**
 * Constelação do laboratório: os nomes de quem está no laboratório agora
 * flutuam devagar no fundo da abertura da página inicial, como estrelas.
 * Colegas da mesma turma se ligam por uma linha fina na cor da série quando
 * passam perto um do outro. Sem aula ao vivo, aparecem (mais apagados) os
 * alunos que já passaram pelo laboratório hoje; sem ninguém, nada aparece.
 *
 * É só decoração (aria-hidden): os nomes, para leitores de tela, já estão no
 * painel do laboratório ao lado. Respeita "reduzir movimento" (fica parado),
 * pausa quando a aba ou a abertura saem de vista e segue a mesma regra de
 * nomes da home (visitante vê só primeiro nome e inicial). No celular fica
 * desligada: a abertura não tem espaço livre e o painel já mostra os nomes.
 */
export function ConstelacaoNomes({
  sessoes,
  logado,
  className,
}: {
  sessoes: SessaoLab[];
  logado: boolean;
  className?: string;
}) {
  const agora = useAgora(15_000);
  const hoje = hojeNaEscola();

  const estrelas = useMemo<Estrela[]>(() => {
    const doDia = sessoes.filter((s) => s.data === hoje && s.ausencia === null && !s.semMarcacao);
    const aoVivo = doDia.filter((s) => estadoDaSessao(s, agora) === "ao-vivo");
    const fonte =
      aoVivo.length > 0 ? aoVivo : doDia.filter((s) => estadoDaSessao(s, agora) === "encerrada");
    const vistos = new Map<string, Estrela>();
    for (const s of fonte) {
      const chave = `${s.turmaId}|${s.alunoId}`;
      if (vistos.has(chave)) continue;
      vistos.set(chave, {
        chave,
        nome: nomeExibido(s.alunoNome, logado),
        turma: s.turmaRotulo,
        cor: corDaTurma(s.turmaRotulo),
        vivo: aoVivo.length > 0,
      });
    }
    return [...vistos.values()].slice(0, MAX_NOMES);
  }, [sessoes, hoje, agora, logado]);

  const caixa = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const rotulos = useRef(new Map<string, HTMLSpanElement>());
  const corpos = useRef(new Map<string, Corpo>());
  const [montado, setMontado] = useState(false);
  useEffect(() => setMontado(true), []);

  useEffect(() => {
    const el = caixa.current;
    if (!el || estrelas.length === 0) return;
    // No celular a camada fica escondida (CSS): nem anima.
    if (window.matchMedia("(max-width: 639px)").matches) return;
    const parado = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Onde ficam o título, os textos, os botões e o painel, em relação à área
    // dos nomes. Os nomes passeiam pelos espaços livres e desviam desses blocos.
    let obstaculos: Caixa[] = [];
    const medirObstaculos = () => {
      const base = el.getBoundingClientRect();
      const raiz = el.parentElement;
      obstaculos = raiz
        ? [...raiz.querySelectorAll(OBSTACULOS)]
            .filter((o) => !el.contains(o))
            .map((o) => o.getBoundingClientRect())
            .filter((r) => r.width > 0 && r.height > 0)
            .map((r) => ({
              x: r.left - base.left - FOLGA,
              y: r.top - base.top - FOLGA,
              w: r.width + FOLGA * 2,
              h: r.height + FOLGA * 2,
            }))
        : [];
    };
    medirObstaculos();
    const bate = (x: number, y: number, w: number, h: number) =>
      obstaculos.find((o) => x < o.x + o.w && x + w > o.x && y < o.y + o.h && y + h > o.y);

    // Cada nome nasce num ponto estável e livre; quem já estava continua onde estava.
    const { width: w0, height: h0 } = el.getBoundingClientRect();
    const atuais = new Set(estrelas.map((e) => e.chave));
    for (const k of [...corpos.current.keys()]) if (!atuais.has(k)) corpos.current.delete(k);
    for (const e of estrelas) {
      if (corpos.current.has(e.chave)) continue;
      const a = semente(e.chave);
      const b = semente(e.chave + "y");
      const ang = a * Math.PI * 2;
      const vel = 7 + b * 9; // px por segundo: devagar, para não distrair
      let x = 0.08 * w0 + a * 0.84 * w0;
      let y = 0.1 * h0 + b * 0.8 * h0;
      for (let tentativa = 1; tentativa <= 40 && bate(x, y, 170, 30); tentativa++) {
        x = 8 + semente(e.chave + tentativa) * Math.max(0, w0 - 186);
        y = 8 + semente(e.chave + "y" + tentativa) * Math.max(0, h0 - 46);
      }
      corpos.current.set(e.chave, {
        x,
        y,
        vx: Math.cos(ang) * vel,
        vy: Math.sin(ang) * vel,
        fase: a * 10,
      });
    }

    let quadro = 0;
    let anterior = performance.now();
    let visivel = true;

    const desenhar = (t: number) => {
      const { width: w, height: h } = el.getBoundingClientRect();
      const dt = Math.min(0.05, (t - anterior) / 1000);
      anterior = t;
      // Dois nomes um em cima do outro: se afastam devagar, cada um para um lado.
      if (!parado) {
        const lista = estrelas
          .map((e) => ({ c: corpos.current.get(e.chave), s: rotulos.current.get(e.chave) }))
          .filter((x): x is { c: Corpo; s: HTMLSpanElement } => Boolean(x.c && x.s))
          .map(({ c, s }) => ({ c, w: s.offsetWidth + 10, h: s.offsetHeight + 8 }));
        for (let i = 0; i < lista.length; i++)
          for (let j = i + 1; j < lista.length; j++) {
            const p = lista[i]!;
            const q = lista[j]!;
            const sx = Math.min(p.c.x + p.w, q.c.x + q.w) - Math.max(p.c.x, q.c.x);
            const sy = Math.min(p.c.y + p.h, q.c.y + q.h) - Math.max(p.c.y, q.c.y);
            if (sx <= 0 || sy <= 0) continue;
            const passo = Math.min(sx < sy ? sx : sy, 30 * dt + 0.3) / 2;
            if (sx < sy) {
              const pEsq = p.c.x < q.c.x ? 1 : -1;
              p.c.x -= passo * pEsq;
              q.c.x += passo * pEsq;
              p.c.vx = -Math.abs(p.c.vx) * pEsq;
              q.c.vx = Math.abs(q.c.vx) * pEsq;
            } else {
              const pCima = p.c.y < q.c.y ? 1 : -1;
              p.c.y -= passo * pCima;
              q.c.y += passo * pCima;
              p.c.vy = -Math.abs(p.c.vy) * pCima;
              q.c.vy = Math.abs(q.c.vy) * pCima;
            }
          }
      }
      const pos: { e: Estrela; x: number; y: number }[] = [];
      for (const e of estrelas) {
        const c = corpos.current.get(e.chave);
        const span = rotulos.current.get(e.chave);
        if (!c || !span) continue;
        const lw = span.offsetWidth;
        const lh = span.offsetHeight;
        if (!parado) {
          c.x += c.vx * dt;
          c.y += c.vy * dt;
          // Borda macia: o nome dá meia-volta sem bater.
          if (c.x < 8) c.vx = Math.abs(c.vx);
          if (c.x > w - lw - 8) c.vx = -Math.abs(c.vx);
          if (c.y < 8) c.vy = Math.abs(c.vy);
          if (c.y > h - lh - 8) c.vy = -Math.abs(c.vy);
          // Encostou num bloco de conteúdo: sai pelo lado mais perto e muda de rumo.
          const o = bate(c.x, c.y, lw, lh);
          if (o) {
            const esq = c.x + lw - o.x;
            const dir = o.x + o.w - c.x;
            const cima = c.y + lh - o.y;
            const baixo = o.y + o.h - c.y;
            const m = Math.min(esq, dir, cima, baixo);
            const passo = Math.min(m, 40 * dt + 0.5);
            if (m === esq) {
              c.x -= passo;
              c.vx = -Math.abs(c.vx);
            } else if (m === dir) {
              c.x += passo;
              c.vx = Math.abs(c.vx);
            } else if (m === cima) {
              c.y -= passo;
              c.vy = -Math.abs(c.vy);
            } else {
              c.y += passo;
              c.vy = Math.abs(c.vy);
            }
          }
        }
        const ondaY = parado ? 0 : Math.sin(t / 1600 + c.fase) * 4;
        span.style.transform = `translate3d(${c.x.toFixed(1)}px, ${(c.y + ondaY).toFixed(1)}px, 0)`;
        pos.push({ e, x: c.x + 10, y: c.y + ondaY + lh / 2 });
      }

      // Linhas entre colegas da mesma turma que estão perto.
      const s = svg.current;
      if (s) {
        let html = "";
        for (let i = 0; i < pos.length; i++)
          for (let j = i + 1; j < pos.length; j++) {
            const p = pos[i]!;
            const q = pos[j]!;
            if (p.e.turma !== q.e.turma) continue;
            const d = Math.hypot(p.x - q.x, p.y - q.y);
            if (d > ALCANCE) continue;
            const op = (1 - d / ALCANCE) * (p.e.vivo ? 0.55 : 0.3);
            html += `<line x1="${p.x.toFixed(1)}" y1="${p.y.toFixed(1)}" x2="${q.x.toFixed(1)}" y2="${q.y.toFixed(1)}" stroke="${p.e.cor}" stroke-opacity="${op.toFixed(2)}" stroke-width="1" />`;
          }
        s.innerHTML = html;
      }
      if (!parado && visivel) quadro = requestAnimationFrame(desenhar);
    };

    const ligar = () => {
      cancelAnimationFrame(quadro);
      anterior = performance.now();
      quadro = requestAnimationFrame(desenhar);
    };
    ligar();

    // Fora de vista (rolou para baixo ou trocou de aba): para de animar.
    const io = new IntersectionObserver(([x]) => {
      visivel = Boolean(x?.isIntersecting) && document.visibilityState === "visible";
      if (visivel) ligar();
    });
    io.observe(el);
    const aba = () => {
      visivel = document.visibilityState === "visible";
      if (visivel) ligar();
    };
    document.addEventListener("visibilitychange", aba);
    const redimensionar = () => {
      medirObstaculos();
      ligar();
    };
    // O painel ao vivo muda de altura (alunos entrando): mede de novo de tempos em tempos.
    const remedir = window.setInterval(medirObstaculos, 2000);
    window.addEventListener("resize", redimensionar);
    return () => {
      cancelAnimationFrame(quadro);
      io.disconnect();
      document.removeEventListener("visibilitychange", aba);
      window.removeEventListener("resize", redimensionar);
      window.clearInterval(remedir);
    };
  }, [estrelas]);

  if (!montado || estrelas.length === 0) return null;

  return (
    <div
      ref={caixa}
      aria-hidden
      className={
        "constelacao-lab pointer-events-none absolute inset-0 overflow-hidden " + (className ?? "")
      }
    >
      <svg ref={svg} className="absolute inset-0 size-full" />
      {estrelas.map((e, i) => (
        <span
          key={e.chave}
          ref={(n) => {
            if (n) rotulos.current.set(e.chave, n);
            else rotulos.current.delete(e.chave);
          }}
          className={"constelacao-nome absolute left-0 top-0 " + (e.vivo ? "is-vivo" : "is-hoje")}
          style={{ ["--cor" as string]: e.cor, animationDelay: `${i * 90}ms` }}
        >
          <span className="constelacao-ponto" />
          {e.nome}
          <span className="constelacao-turma">{e.turma}</span>
        </span>
      ))}
    </div>
  );
}
