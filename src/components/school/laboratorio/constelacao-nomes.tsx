import { useEffect, useMemo, useRef, useState } from "react";

import "@/styles/destaque-nomes.css";

import { rotuloTurma } from "@/components/school/laboratorio/ficha-aluno";
import { useAppStore } from "@/lib/app-store";
import {
  estadoDaSessao,
  hojeNaEscola,
  nomeExibido,
  useAgora,
  type SessaoLab,
} from "@/lib/laboratorio";

/** Cor de cada série (1º ao 5º ano), para o brilho do nome. */
const COR_SERIE = ["#38bdf8", "#a78bfa", "#34d399", "#fbbf24", "#fb7185"];
/** O que o nome contorna: título, textos, botões, painel ao vivo. */
const OBSTACULOS =
  ".home-hero-entrance, .home-live-frame, .home-hero-stats, [data-constelacao-evitar]";
const FOLGA = 16;
/** Quanto tempo cada nome fica na tela e quanto dura a troca. */
const TEMPO_NOME = 5200;
const TEMPO_TROCA = 900;

interface Destaque {
  chave: string;
  nome: string;
  turma: string;
  cor: string;
}

interface Caixa {
  x: number;
  y: number;
  w: number;
  h: number;
}

function corDaTurma(rotulo: string) {
  const n = Number(rotulo.match(/\d+/)?.[0]);
  return COR_SERIE[(Number.isFinite(n) ? n - 1 : 0) % COR_SERIE.length]!;
}

/** Embaralha (Fisher–Yates) para os nomes virem em ordem aleatória. */
function embaralhar<T>(lista: T[]): T[] {
  const a = [...lista];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/**
 * Um nome de cada vez, flutuando devagar no fundo da abertura da página
 * inicial, com o brilho da cor da série e a turma logo acima.
 *
 * - Com aula no laboratório (ao vivo ou pausada), só passam os nomes de quem
 *   está nessa aula, com a legenda "No laboratório agora".
 * - Com aula marcada que ainda não começou, passam os nomes dela antes
 *   (pré-exibição), com a legenda "Próxima aula no laboratório".
 * - Sem aula, passam em ordem aleatória alunos de todas as turmas.
 *
 * O nome procura um espaço livre (desvia do título, dos textos, dos botões e
 * do painel) e, a cada troca, some suavemente e reaparece em outro lugar.
 * É só decoração (aria-hidden): os nomes de quem está no laboratório já
 * aparecem no painel ao lado. Segue a regra de nomes da home (visitante vê
 * primeiro nome e inicial), respeita "reduzir movimento", pausa fora de vista
 * e fica desligado no celular, onde a abertura não tem espaço livre.
 */
export function ConstelacaoNomes({
  sessoes,
  logado,
  fixos,
  evitar = OBSTACULOS,
  grande = false,
  className,
}: {
  sessoes: SessaoLab[];
  logado: boolean;
  /**
   * Lista pronta (ex.: os alunos da aula na tela cheia). Quando vem, só esses
   * nomes passam, com a legenda "No laboratório agora".
   */
  fixos?: { chave: string; nome: string; turma: string }[];
  /** Seletor dos blocos que o nome contorna (padrão: os da página inicial). */
  evitar?: string;
  /** Letras maiores, para a TV na tela cheia. */
  grande?: boolean;
  className?: string;
}) {
  const { turmas } = useAppStore();
  // De 5 em 5 segundos basta para perceber a aula começando ou acabando.
  const agora = useAgora(5000);
  const hoje = hojeNaEscola();

  /**
   * Os nomes da aula de hoje que ainda não acabou: a que está no laboratório
   * agora ou, se ainda não começou, a próxima marcada (pré-exibição). Vazio
   * quando não há aula ao vivo nem marcada.
   */
  const aula = useMemo<{ modo: "vivo" | "proxima"; nomes: Destaque[] } | null>(() => {
    const doDia = sessoes.filter(
      (s) =>
        s.data === hoje &&
        s.ausencia === null &&
        !s.semMarcacao &&
        estadoDaSessao(s, agora) !== "encerrada",
    );
    const vivas = doDia.filter((s) => estadoDaSessao(s, agora) === "ao-vivo");
    let escolhidas = vivas;
    let modo: "vivo" | "proxima" = "vivo";
    if (vivas.length === 0) {
      const proxima = [...doDia].sort((a, b) => a.inicio.localeCompare(b.inicio))[0];
      if (!proxima) return null;
      escolhidas = doDia.filter((s) => s.grupoId === proxima.grupoId);
      modo = "proxima";
    }
    const vistos = new Map<string, Destaque>();
    for (const s of escolhidas) {
      const chave = `${s.turmaId}|${s.alunoId}`;
      if (!vistos.has(chave))
        vistos.set(chave, {
          chave,
          nome: nomeExibido(s.alunoNome, logado),
          turma: s.turmaRotulo,
          cor: corDaTurma(s.turmaRotulo),
        });
    }
    return { modo, nomes: [...vistos.values()] };
  }, [sessoes, hoje, agora, logado]);

  const todos = useMemo<Destaque[]>(
    () =>
      turmas.flatMap((t) => {
        const rotulo = rotuloTurma(t.serie, t.letra);
        return t.alunos.map((a) => ({
          chave: `${t.id}|${a.id}`,
          nome: nomeExibido(a.nome, logado),
          turma: rotulo,
          cor: corDaTurma(rotulo),
        }));
      }),
    [turmas, logado],
  );

  const fixosComCor = useMemo<Destaque[] | null>(
    () =>
      fixos
        ? fixos.map((d) => ({ ...d, nome: nomeExibido(d.nome, logado), cor: corDaTurma(d.turma) }))
        : null,
    [fixos, logado],
  );
  const modo = fixosComCor ? "vivo" : (aula?.modo ?? "todos");
  const fonte = fixosComCor ?? (aula?.nomes.length ? aula.nomes : todos);
  /** Assinatura da lista, para recomeçar o rodízio só quando ela muda de verdade. */
  const assinatura = fonte.map((d) => d.chave).join(",");
  const fonteRef = useRef(fonte);
  fonteRef.current = fonte;

  const [montado, setMontado] = useState(false);
  const [atual, setAtual] = useState<Destaque | null>(null);
  const [saindo, setSaindo] = useState(false);
  const caixa = useRef<HTMLDivElement>(null);
  const rotulo = useRef<HTMLDivElement>(null);
  const corpo = useRef({ x: 0, y: 0, vx: 0, vy: 0 });
  const obstaculos = useRef<Caixa[]>([]);

  useEffect(() => setMontado(true), []);

  /** Mede onde estão os blocos de conteúdo, em relação à área do efeito. */
  function medirObstaculos() {
    const el = caixa.current;
    if (!el) return;
    const base = el.getBoundingClientRect();
    obstaculos.current = [...(el.parentElement?.querySelectorAll(evitar) ?? [])]
      .filter((o) => !el.contains(o))
      .map((o) => o.getBoundingClientRect())
      .filter((r) => r.width > 0 && r.height > 0)
      .map((r) => ({
        x: r.left - base.left - FOLGA,
        y: r.top - base.top - FOLGA,
        w: r.width + FOLGA * 2,
        h: r.height + FOLGA * 2,
      }));
  }

  function bate(x: number, y: number, w: number, h: number) {
    return obstaculos.current.find(
      (o) => x < o.x + o.w && x + w > o.x && y < o.y + o.h && y + h > o.y,
    );
  }

  /** Quanto de um retângulo cai por cima dos blocos de conteúdo. */
  function invasao(x: number, y: number, w: number, h: number) {
    let total = 0;
    for (const o of obstaculos.current) {
      const dx = Math.min(x + w, o.x + o.w) - Math.max(x, o.x);
      const dy = Math.min(y + h, o.y + o.h) - Math.max(y, o.y);
      if (dx > 0 && dy > 0) total += dx * dy;
    }
    return total;
  }

  /** Escolhe um lugar livre e um rumo novo para o próximo nome. */
  function reposicionar(nome: string) {
    const el = caixa.current;
    if (!el) return;
    medirObstaculos();
    const { width: w, height: h } = el.getBoundingClientRect();
    // Largura aproximada do nome (a letra grande tem ~15px), com folga.
    const lw = Math.max(220, nome.length * (grande ? 26 : 16) + 24);
    const lh = 70;
    // Numa abertura cheia pode não existir lugar totalmente livre. Antes o
    // sorteio parava no último palpite — e o nome caía em cima do selo ou do
    // título. Agora fica com o palpite que invade menos.
    let x = 12;
    let y = 12;
    let menor = Number.POSITIVE_INFINITY;
    for (let i = 0; i < 80; i++) {
      const cx = 12 + Math.random() * Math.max(0, w - lw - 24);
      const cy = 12 + Math.random() * Math.max(0, h - lh - 24);
      const area = invasao(cx, cy, lw, lh);
      if (area < menor) {
        menor = area;
        x = cx;
        y = cy;
      }
      if (area === 0) break;
    }
    const ang = Math.random() * Math.PI * 2;
    const vel = 5 + Math.random() * 5;
    corpo.current = { x, y, vx: Math.cos(ang) * vel, vy: Math.sin(ang) * vel };
  }

  // Rodízio: um nome por vez, em ordem aleatória, sem repetir até passar todos.
  useEffect(() => {
    if (!montado || fonteRef.current.length === 0) {
      setAtual(null);
      return;
    }
    if (window.matchMedia("(max-width: 639px)").matches) return;
    let fila = embaralhar(fonteRef.current);
    let troca = 0;
    const proximo = () => {
      if (fila.length === 0) fila = embaralhar(fonteRef.current);
      const d = fila.shift();
      if (!d) return;
      reposicionar(d.nome);
      setAtual(d);
      setSaindo(false);
    };
    proximo();
    const id = window.setInterval(() => {
      setSaindo(true);
      troca = window.setTimeout(proximo, TEMPO_TROCA);
    }, TEMPO_NOME + TEMPO_TROCA);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(troca);
    };
    // A assinatura resume a lista; reiniciar a cada render embaralharia sem parar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [montado, assinatura]);

  // Movimento cinematográfico suave: trajetória senoidal contínua, sem colisões
  // ou inversões bruscas de velocidade que causavam tremor nos nomes.
  useEffect(() => {
    const el = caixa.current;
    if (!el || !atual) return;
    const r = rotulo.current;
    if (!r) return;
    const { width, height } = el.getBoundingClientRect();
    const nameWidth = r.offsetWidth || Math.min(360, atual.nome.length * 13 + 40);
    const nameHeight = r.offsetHeight || 56;
    const startX = Math.max(18, Math.min(width - nameWidth - 18, width * (0.18 + Math.random() * 0.42)));
    const startY = Math.max(18, Math.min(height - nameHeight - 18, height * (0.24 + Math.random() * 0.36)));
    const travelX = Math.max(24, Math.min(width - nameWidth - 36, width * 0.22));
    const travelY = Math.min(12, height * 0.025);
    const inicio = performance.now();
    let frame = 0;
    let visivel = true;
    const passo = (now: number) => {
      const t = (now - inicio) / 1000;
      const x = Math.max(18, Math.min(width - nameWidth - 18, startX + Math.sin(t * 0.22) * travelX));
      const y = Math.max(18, Math.min(height - nameHeight - 18, startY + Math.sin(t * 0.31) * travelY));
      r.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
      if (visivel) frame = requestAnimationFrame(passo);
    };
    frame = requestAnimationFrame(passo);
    const visibility = () => {
      visivel = document.visibilityState === "visible";
      if (visivel) frame = requestAnimationFrame(passo);
      else cancelAnimationFrame(frame);
    };
    document.addEventListener("visibilitychange", visibility);
    const resize = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(passo);
    };
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("resize", resize);
    };
  }, [atual]);

  if (!montado || !atual) return null;

  return (
    <div
      ref={caixa}
      aria-hidden
      className={
        "constelacao-lab pointer-events-none absolute inset-0 overflow-hidden " +
        (grande ? "is-grande " : "") +
        (className ?? "")
      }
    >
      <div
        ref={rotulo}
        key={atual.chave}
        className={"constelacao-nome constelacao-nome-escolar absolute left-0 top-0" + (saindo ? " is-saindo" : "")}
        style={{
          ["--cor" as string]: atual.cor,
          transform: `translate3d(${corpo.current.x}px, ${corpo.current.y}px, 0)`,
        }}
      >
        <span aria-hidden className="constelacao-brilho constelacao-brilho-um">✦</span>
        <span aria-hidden className="constelacao-brilho constelacao-brilho-dois">✧</span>
        <span className="constelacao-legenda">
          <span className={"constelacao-ponto" + (modo === "vivo" ? " is-vivo" : "")} />
          {modo === "vivo"
            ? "No laboratório agora"
            : modo === "proxima"
              ? "Próxima aula no laboratório"
              : "Nossos alunos"}{" "}
          · {atual.turma}
        </span>
        <span className="constelacao-texto">
          {[...atual.nome].map((letra, i) => (
            <span key={i} style={{ animationDelay: `${120 + i * 28}ms` }}>
              {letra === " " ? " " : letra}
            </span>
          ))}
        </span>
      </div>
    </div>
  );
}
