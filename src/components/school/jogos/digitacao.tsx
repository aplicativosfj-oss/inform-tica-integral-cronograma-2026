import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  GraduationCap,
  Keyboard,
  Loader2,
  Lock,
  Map as MapaIcone,
  RotateCcw,
  Star,
  Swords,
  Trophy,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  BLOCOS,
  CENARIOS,
  COR_DEDO,
  desafioDaSerie,
  fasesDaSerie,
  LICOES,
  NOME_DEDO,
  ritmoRobo,
  type Fase,
  type Prompt,
  type Serie,
} from "@/components/school/jogos/digitacao-dados";
import { PraticaDigitacao } from "@/components/school/jogos/digitacao-pratica";
import {
  concluirDesafio,
  concluirFase,
  lerProgresso,
  marcarLicao,
  marcarTeoria,
  type Progresso,
  type ResultadoFase,
} from "@/components/school/jogos/digitacao-progresso";
import {
  Maos,
  Postura,
  Teclado,
  Teco,
  TutorFala,
} from "@/components/school/jogos/digitacao-visual";
import { lerAlunoSessao } from "@/lib/aluno-session";
import { useAppStore } from "@/lib/app-store";
import type { Adversario } from "@/lib/estrelas";
import { fetchRanking, type Placar } from "@/lib/placares";
import { cn } from "@/lib/utils";

/**
 * Escola de Digitação: tutor, fases por série e desafio contra o robô.
 *
 * O caminho é o de uma aula: primeiro o tutor ensina postura, posição das mãos
 * e o dedo de cada tecla; depois as fases da série da criança (vogais, alfabeto
 * e números no 1º ano; sílabas e palavras com figura no 2º; frases e textos
 * nos anos seguintes); por fim o desafio contra o robô. Logada, a criança tem
 * a pontuação gravada na trilha, nas estrelas e no ranking de digitação.
 */

type Tela = "home" | "teoria" | "licoes" | "fases" | "ranking" | "pratica" | "resultado";

interface Sessao {
  tipo: "licao" | "fase" | "desafio";
  id: string;
  titulo: string;
  prompts: Prompt[];
  modo: "alvo" | "texto";
  foco?: string;
  abertura?: string;
  robo?: number;
  cenario: string;
  chave: number;
}

interface Fechamento {
  resultado: ResultadoFase;
  estrelasGanhas: number;
  venceu?: boolean;
  recorde?: boolean;
}

function serieDoTexto(s: string | undefined): Serie | null {
  const m = (s ?? "").match(/(\d)/);
  const n = m ? Number(m[1]) : 0;
  return n >= 1 && n <= 5 ? (n as Serie) : null;
}

function Estrelas({ n, tamanho = "size-4" }: { n: number; tamanho?: string }) {
  return (
    <span className="flex gap-0.5" aria-label={`${n} de 3 estrelas`}>
      {[1, 2, 3].map((i) => (
        <img
          key={i}
          src="/images/jogos/estrela-ouro.png"
          alt=""
          className={cn(tamanho, "object-contain", i > n && "opacity-25 grayscale")}
        />
      ))}
    </span>
  );
}

/** Troféu de verdade (ouro, prata ou bronze) conforme as estrelas ganhas. */
function Trofeu({ estrelas, ganhou }: { estrelas: number; ganhou: boolean }) {
  const arquivo = !ganhou
    ? "trofeu-prata"
    : estrelas >= 3
      ? "trofeu-ouro"
      : estrelas === 2
        ? "trofeu-prata"
        : "trofeu-bronze";
  return (
    <img
      src={`/images/jogos/${arquivo}.png`}
      alt=""
      className={cn("size-20 object-contain drop-shadow-lg", !ganhou && "opacity-40 grayscale")}
    />
  );
}

const SLIDES = [
  {
    titulo: "Sente-se do jeito certo",
    fala: "Antes de digitar, vamos arrumar o corpo. Quem senta bem digita melhor e não se cansa!",
  },
  {
    titulo: "A posição inicial",
    fala: "Esta é a sua casinha: as mãos sempre voltam para cá depois de digitar cada tecla.",
  },
  {
    titulo: "Um dedo para cada tecla",
    fala: "Cada dedo cuida de uma coluna do teclado. As cores mostram quem é o responsável.",
  },
  {
    titulo: "As regras de ouro",
    fala: "Guarde estas cinco regras. Elas valem mais do que qualquer velocidade!",
  },
];

function Voltar({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-8 w-fit cursor-pointer items-center gap-1 rounded-lg px-2 text-xs font-semibold text-slate-300 hover:bg-white/10"
    >
      <ArrowLeft className="size-4" /> voltar
    </button>
  );
}

function Teoria({ aoFim, aoSair }: { aoFim: () => void; aoSair: () => void }) {
  const [i, setI] = useState(0);
  const slide = SLIDES[i]!;
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-950 p-3 text-white sm:p-4">
      <div className="flex items-center justify-between">
        <Voltar onClick={aoSair} />
        <span className="text-xs text-slate-400">
          Aula {i + 1} de {SLIDES.length}
        </span>
      </div>
      <h4 className="text-lg font-black sm:text-xl">{slide.titulo}</h4>
      <TutorFala texto={slide.fala} humor="animado" />

      <div className="rounded-xl bg-slate-900/70 p-3">
        {i === 0 && (
          <div className="grid gap-3 sm:grid-cols-[1.2fr_1fr] sm:items-center">
            <Postura className="w-full rounded-xl" />
            <ol className="flex flex-col gap-1.5 text-sm">
              {[
                ["1", "Olhos na altura da tela, sem baixar o pescoço."],
                ["2", "Costas retas, encostadas na cadeira."],
                ["3", "Punhos leves, sem apoiar na mesa."],
                ["4", "Pés inteiros no chão."],
                ["5", "Cotovelos dobrados, perto do corpo."],
              ].map(([n, t]) => (
                <li key={n} className="flex items-start gap-2">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-amber-400 text-xs font-black text-amber-950">
                    {n}
                  </span>
                  {t}
                </li>
              ))}
            </ol>
          </div>
        )}
        {i === 1 && (
          <div className="flex flex-col gap-3">
            <figure className="overflow-hidden rounded-xl border border-sky-400/30 bg-slate-950 shadow-lg shadow-sky-950/40">
              <img
                src="/images/jogos/digitacao-maos-guia-pro.webp"
                alt="Posição correta das mãos no teclado: dedos da mão esquerda em A, S, D e F; dedos da mão direita em J, K, L e Ç; polegares sobre a barra de espaço."
                className="aspect-video w-full object-cover"
              />
              <figcaption className="border-t border-white/10 bg-slate-900/95 px-3 py-2 text-center text-xs font-semibold text-sky-100">
                Posição inicial: punhos retos, mãos relaxadas e dedos na fileira central.
              </figcaption>
            </figure>
            <Teclado foco="asdfjklç" />
            <Maos ativos={[0, 1, 2, 3, 6, 7, 8, 9]} className="mx-auto max-w-sm" />
            <ul className="grid gap-1 text-sm sm:grid-cols-2">
              <li>
                ✋ Mão esquerda em <b>A S D F</b>, mão direita em <b>J K L Ç</b>.
              </li>
              <li>
                👆 Os indicadores ficam em <b>F</b> e <b>J</b>: sinta o pontinho em relevo!
              </li>
              <li>
                👍 Os polegares descansam na barra de <b>espaço</b>.
              </li>
              <li>↩️ Depois de cada tecla, o dedo volta para a casinha.</li>
            </ul>
          </div>
        )}
        {i === 2 && (
          <div className="flex flex-col gap-3">
            <Teclado cores />
            <div className="grid grid-cols-2 gap-1.5 text-xs sm:grid-cols-4">
              {[0, 1, 2, 3, 6, 7, 8, 9].map((d) => (
                <span
                  key={d}
                  className="flex items-center gap-1.5 rounded-lg border px-2 py-1"
                  style={{ borderColor: COR_DEDO[d], background: `${COR_DEDO[d]}22` }}
                >
                  <span
                    className="size-3 shrink-0 rounded-full"
                    style={{ background: COR_DEDO[d] }}
                  />
                  {NOME_DEDO[d]}
                </span>
              ))}
            </div>
          </div>
        )}
        {i === 3 && (
          <ul className="flex flex-col gap-2 text-sm">
            {[
              ["👀", "Olhe para a tela, não para o teclado. O teclado da tela ajuda você."],
              ["🏠", "Depois de cada tecla, volte os dedos para a casinha (A S D F  J K L Ç)."],
              ["🐢", "Devagar e certo: a velocidade vem sozinha com o treino."],
              ["💛", "Errar é normal. O Teco te avisa qual era o dedo certo."],
              ["⏱️", "Treine um pouquinho todo dia. Dez minutos valem mais que uma hora só."],
            ].map(([e, t]) => (
              <li key={t} className="flex items-start gap-2 rounded-lg bg-white/5 p-2">
                <span className="text-lg">{e}</span>
                {t}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          disabled={i === 0}
          onClick={() => setI(i - 1)}
          className="flex h-10 cursor-pointer items-center gap-1 rounded-xl border border-white/20 px-3 text-sm font-semibold text-slate-200 hover:bg-white/10 disabled:cursor-default disabled:opacity-30"
        >
          <ArrowLeft className="size-4" /> Anterior
        </button>
        {i < SLIDES.length - 1 ? (
          <button
            type="button"
            onClick={() => setI(i + 1)}
            className="flex h-10 cursor-pointer items-center gap-1 rounded-xl bg-sky-500 px-4 text-sm font-bold text-white hover:bg-sky-400"
          >
            Próxima <ArrowRight className="size-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={aoFim}
            className="flex h-10 cursor-pointer items-center gap-1 rounded-xl bg-emerald-500 px-4 text-sm font-bold text-white hover:bg-emerald-400"
          >
            Ir para as lições <ArrowRight className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function Ranking({ aoSair }: { aoSair: () => void }) {
  const [linhas, setLinhas] = useState<Placar[] | null>(null);
  useEffect(() => {
    let vivo = true;
    void fetchRanking("digitacao").then((r) => {
      if (vivo) setLinhas(r.placares);
    });
    return () => {
      vivo = false;
    };
  }, []);
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-slate-950 p-3 text-white sm:p-4">
      <Voltar onClick={aoSair} />
      <h4 className="flex items-center gap-2 text-lg font-black">
        <Trophy className="size-5 text-amber-400" /> Ranking de digitação
      </h4>
      {linhas === null ? (
        <p className="flex items-center gap-2 text-xs text-slate-400">
          <Loader2 className="size-3.5 animate-spin" /> carregando…
        </p>
      ) : linhas.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/20 p-3 text-center text-xs text-slate-400">
          Ninguém no ranking ainda. Conclua uma fase logado(a) para aparecer aqui!
        </p>
      ) : (
        linhas.slice(0, 10).map((l, i) => (
          <div
            key={i}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs",
              i === 0 ? "border-amber-400/50 bg-amber-400/10" : "border-white/10 bg-white/5",
            )}
          >
            <span className="w-5 text-center font-bold text-slate-400">{i + 1}</span>
            <span className="min-w-0 flex-1 truncate font-semibold">{l.aluno}</span>
            <span className="hidden truncate text-slate-400 sm:block">{l.nivel}</span>
            <span className="font-bold text-amber-300">{l.pontos} pts</span>
          </div>
        ))
      )}
    </div>
  );
}

export function Digitacao({ adversario, nivel }: { adversario: Adversario; nivel: number }) {
  const { turmas } = useAppStore();
  const sessao = lerAlunoSessao();
  const serieLogada = useMemo(
    () => serieDoTexto(turmas.find((t) => t.id === sessao?.turmaId)?.serie),
    [turmas, sessao?.turmaId],
  );
  const [serieEscolhida, setSerieEscolhida] = useState<Serie>(1);
  const serie: Serie = serieLogada ?? serieEscolhida;

  const [tela, setTela] = useState<Tela>("home");
  const [prog, setProg] = useState<Progresso>(() => lerProgresso());
  const [sess, setSess] = useState<Sessao | null>(null);
  const [fim, setFim] = useState<Fechamento | null>(null);

  const primeiroNome = sessao?.nome.split(" ")[0];
  const fases = useMemo(() => fasesDaSerie(serie), [serie]);

  const faseLiberada = (i: number): boolean => {
    const f = fases[i]!;
    if (i === 0 || f.serie < serie) return true;
    return (prog.fases[fases[i - 1]!.id]?.estrelas ?? 0) >= 1;
  };

  const iniciar = useCallback((s: Omit<Sessao, "chave" | "cenario">) => {
    setSess({
      ...s,
      cenario: CENARIOS[Math.floor(Math.random() * CENARIOS.length)]!,
      chave: Date.now(),
    });
    setFim(null);
    setTela("pratica");
  }, []);

  const iniciarFase = (f: Fase) =>
    iniciar({
      tipo: "fase",
      id: f.id,
      titulo: `${f.emoji} ${f.titulo}`,
      prompts: f.gerar({ nome: primeiroNome }),
      modo: f.modo,
      abertura: `${f.descricao} Acerte pelo menos 70% para passar e 95% para ganhar as três estrelas!`,
    });

  const iniciarLicao = (i: number) => {
    const l = LICOES[i]!;
    iniciar({
      tipo: "licao",
      id: l.id,
      titulo: `Lição ${i + 1} · ${l.titulo}`,
      prompts: l.prompts.map((alvo) => ({ alvo })),
      modo: "alvo",
      foco: l.teclas,
      abertura: l.explicacao,
    });
  };

  const iniciarDesafio = () => {
    const d = desafioDaSerie(serie);
    iniciar({
      tipo: "desafio",
      id: "desafio",
      titulo: "🤖 Desafio contra o robô",
      prompts: d.prompts,
      modo: d.modo,
      robo: ritmoRobo(serie, nivel),
      abertura:
        "Vou digitar junto com você! Chegue antes de mim, com pelo menos 80% de acerto, para ganhar.",
    });
  };

  const aoConcluir = useCallback(
    (r: ResultadoFase) => {
      if (!sess) return;
      void (async () => {
        if (sess.tipo === "licao") {
          if (r.precisao >= 70) setProg(marcarLicao(sess.id));
          setFim({ resultado: r, estrelasGanhas: 0 });
        } else if (sess.tipo === "fase") {
          const out = await concluirFase(
            sess.id,
            sess.titulo.replace(/^\S+\s/, ""),
            r,
            nivel,
            adversario,
          );
          setProg(out.progresso);
          setFim({ resultado: r, estrelasGanhas: out.estrelasGanhas, recorde: out.recorde });
        } else {
          const total = sess.prompts.reduce((s, p) => s + p.alvo.length, 0);
          const tempoRobo = total / (((sess.robo ?? 10) * 5) / 60);
          const venceu = r.segundos <= tempoRobo && r.precisao >= 80;
          const out = await concluirDesafio(r, venceu, nivel, adversario);
          setProg(out.progresso);
          setFim({ resultado: r, estrelasGanhas: out.estrelasGanhas, venceu });
        }
        setTela("resultado");
      })();
    },
    [sess, nivel, adversario],
  );

  // ------------------------------------------------------------- telas

  if (tela === "teoria") {
    return (
      <Teoria
        aoSair={() => setTela("home")}
        aoFim={() => {
          setProg(marcarTeoria());
          setTela("licoes");
        }}
      />
    );
  }

  if (tela === "ranking") return <Ranking aoSair={() => setTela("home")} />;

  if (tela === "pratica" && sess) {
    return (
      <PraticaDigitacao
        key={sess.chave}
        titulo={sess.titulo}
        prompts={sess.prompts}
        modo={sess.modo}
        {...(sess.foco !== undefined ? { foco: sess.foco } : {})}
        {...(sess.robo !== undefined ? { robo: sess.robo } : {})}
        {...(sess.abertura !== undefined ? { abertura: sess.abertura } : {})}
        cenario={sess.cenario}
        aoConcluir={aoConcluir}
        aoSair={() =>
          setTela(sess.tipo === "licao" ? "licoes" : sess.tipo === "fase" ? "fases" : "home")
        }
      />
    );
  }

  if (tela === "resultado" && sess && fim) {
    const r = fim.resultado;
    const passou = sess.tipo === "desafio" ? Boolean(fim.venceu) : r.precisao >= 70;
    const idxFase = sess.tipo === "fase" ? fases.findIndex((f) => f.id === sess.id) : -1;
    const proxima = idxFase >= 0 && passou ? fases[idxFase + 1] : undefined;
    const idxLicao = sess.tipo === "licao" ? LICOES.findIndex((l) => l.id === sess.id) : -1;
    const proximaLicao = idxLicao >= 0 && passou ? LICOES[idxLicao + 1] : undefined;
    const fala = passou
      ? r.precisao >= 95
        ? "Que máquina! Quase sem erro. Estou orgulhoso de você!"
        : "Muito bem! Continue treinando para chegar às três estrelas."
      : sess.tipo === "desafio"
        ? "O robô foi mais rápido desta vez. Treine as fases e volte para me vencer!"
        : "Ainda não foi. Tente de novo, com calma: precisão vem antes de velocidade.";
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-slate-950 p-4 text-center text-white">
        <Trofeu estrelas={r.estrelas} ganhou={passou} />
        <h4 className="text-xl font-black">
          {sess.tipo === "desafio"
            ? fim.venceu
              ? "Você venceu o robô!"
              : "O robô venceu"
            : passou
              ? sess.tipo === "licao"
                ? "Lição concluída!"
                : "Fase concluída!"
              : "Quase lá!"}
        </h4>
        {sess.tipo === "fase" && <Estrelas n={r.estrelas} tamanho="size-9" />}
        {sess.tipo === "desafio" && (
          <Estrelas n={fim.venceu ? Math.max(1, r.estrelas) : 0} tamanho="size-9" />
        )}
        <div className="grid w-full max-w-sm grid-cols-4 gap-2 text-xs">
          {[
            [r.ppm, "palavras/min"],
            [`${r.precisao}%`, "precisão"],
            [r.erros, "erros"],
            [r.pontos, "pontos"],
          ].map(([v, l]) => (
            <span key={l} className="rounded-lg bg-white/5 p-2">
              <b className="block text-base">{v}</b>
              {l}
            </span>
          ))}
        </div>
        {fim.estrelasGanhas > 0 && (
          <p className="flex items-center gap-1 text-sm font-bold text-amber-300">
            <Star className="size-4 fill-current" /> +{fim.estrelasGanhas} na sua carteira de
            estrelas
          </p>
        )}
        {sessao ? (
          <p className="text-[11px] text-emerald-300">
            Resultado salvo na sua trilha, {primeiroNome}.
          </p>
        ) : (
          <p className="text-[11px] text-slate-400">
            Entre com seu PIN na Área do Aluno para guardar a pontuação na escola.
          </p>
        )}
        <div className="w-full max-w-sm">
          <TutorFala texto={fala} humor={passou ? "animado" : "triste"} />
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {proxima && (
            <button
              type="button"
              onClick={() => iniciarFase(proxima)}
              className="flex h-10 cursor-pointer items-center gap-1.5 rounded-xl bg-emerald-500 px-4 text-sm font-bold text-white hover:bg-emerald-400"
            >
              Próxima fase <ArrowRight className="size-4" />
            </button>
          )}
          {proximaLicao && (
            <button
              type="button"
              onClick={() => iniciarLicao(idxLicao + 1)}
              className="flex h-10 cursor-pointer items-center gap-1.5 rounded-xl bg-emerald-500 px-4 text-sm font-bold text-white hover:bg-emerald-400"
            >
              Próxima lição <ArrowRight className="size-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (sess.tipo === "fase") iniciarFase(fases[idxFase]!);
              else if (sess.tipo === "licao") iniciarLicao(idxLicao);
              else iniciarDesafio();
            }}
            className="flex h-10 cursor-pointer items-center gap-1.5 rounded-xl border border-white/20 px-4 text-sm font-semibold hover:bg-white/10"
          >
            <RotateCcw className="size-4" /> Tentar de novo
          </button>
          <button
            type="button"
            onClick={() =>
              setTela(sess.tipo === "licao" ? "licoes" : sess.tipo === "fase" ? "fases" : "home")
            }
            className="h-10 cursor-pointer rounded-xl border border-white/20 px-4 text-sm font-semibold hover:bg-white/10"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  if (tela === "licoes") {
    return (
      <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-slate-950 p-3 text-white sm:p-4">
        <Voltar onClick={() => setTela("home")} />
        <h4 className="flex items-center gap-2 text-lg font-black">
          <GraduationCap className="size-5 text-sky-300" /> Lições do tutor
        </h4>
        <TutorFala
          texto="Cada lição ensina algumas teclas novas. Faça em ordem, sem pressa!"
          humor="feliz"
        />
        <div className="grid gap-1.5 sm:grid-cols-2">
          {LICOES.map((l, i) => {
            const feita = prog.licoes[l.id];
            const liberada = i === 0 || prog.licoes[LICOES[i - 1]!.id];
            return (
              <button
                key={l.id}
                type="button"
                disabled={!liberada}
                onClick={() => iniciarLicao(i)}
                className={cn(
                  "flex items-center gap-2 rounded-xl border-2 p-2.5 text-left transition-colors",
                  liberada
                    ? "cursor-pointer border-white/15 bg-white/5 hover:border-sky-400"
                    : "border-dashed border-white/10 opacity-50",
                )}
              >
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-black",
                    feita ? "bg-emerald-500 text-white" : "bg-sky-500/20 text-sky-200",
                  )}
                >
                  {liberada ? feita ? "✓" : i + 1 : <Lock className="size-3.5" />}
                </span>
                <span className="min-w-0">
                  <b className="block truncate text-sm">{l.titulo}</b>
                  <span className="text-[11px] text-slate-400">
                    {l.teclas.trim()
                      ? l.teclas.toUpperCase().split("").join(" ")
                      : "Barra de espaço"}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (tela === "fases") {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-950 p-3 text-white sm:p-4">
        <Voltar onClick={() => setTela("home")} />
        <h4 className="flex items-center gap-2 text-lg font-black">
          <MapaIcone className="size-5 text-emerald-300" /> Fases do {serie}º ano
        </h4>
        {BLOCOS.map((bloco) => {
          const doBloco = fases.map((f, i) => ({ f, i })).filter(({ f }) => f.bloco === bloco);
          if (!doBloco.length) return null;
          return (
            <section key={bloco} className="flex flex-col gap-1.5">
              <h5 className="text-xs font-bold uppercase tracking-wider text-sky-300">{bloco}</h5>
              <div className="grid gap-1.5 sm:grid-cols-2">
                {doBloco.map(({ f, i }) => {
                  const p = prog.fases[f.id];
                  const liberada = faseLiberada(i);
                  return (
                    <button
                      key={f.id}
                      type="button"
                      disabled={!liberada}
                      onClick={() => iniciarFase(f)}
                      className={cn(
                        "flex items-center gap-2.5 rounded-xl border-2 p-2.5 text-left transition-colors",
                        liberada
                          ? "cursor-pointer border-white/15 bg-white/5 hover:border-emerald-400"
                          : "border-dashed border-white/10 opacity-50",
                      )}
                    >
                      <span className="text-2xl" aria-hidden>
                        {liberada ? f.emoji : "🔒"}
                      </span>
                      <span className="min-w-0 flex-1">
                        <b className="block truncate text-sm">{f.titulo}</b>
                        <span className="line-clamp-2 text-[11px] leading-tight text-slate-400">
                          {f.descricao}
                        </span>
                      </span>
                      <span className="flex flex-col items-end gap-0.5">
                        <Estrelas n={p?.estrelas ?? 0} />
                        {p && <span className="text-[10px] text-slate-400">{p.melhorPpm} ppm</span>}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    );
  }

  // ---------------------------------------------------------------- home
  const totalEstrelas = Object.values(prog.fases).reduce((s, f) => s + f.estrelas, 0);
  const licoesFeitas = LICOES.filter((l) => prog.licoes[l.id]).length;
  const cartoes = [
    {
      icone: BookOpen,
      cor: "from-sky-500 to-blue-700",
      titulo: "Aprenda a digitar",
      desc: `Postura, posição das mãos e o dedo de cada tecla. ${prog.teoria ? "Aula vista ✓" : "Comece por aqui!"}`,
      acao: () => setTela("teoria"),
    },
    {
      icone: GraduationCap,
      cor: "from-indigo-500 to-violet-700",
      titulo: "Lições com o tutor",
      desc: `Treino guiado, tecla por tecla. ${licoesFeitas} de ${LICOES.length} feitas.`,
      acao: () => setTela("licoes"),
    },
    {
      icone: MapaIcone,
      cor: "from-emerald-500 to-teal-700",
      titulo: `Fases do ${serie}º ano`,
      desc: `${fases.length} fases: letras, números, sílabas, palavras e frases. ${totalEstrelas} ★ conquistadas.`,
      acao: () => setTela("fases"),
    },
    {
      icone: Swords,
      cor: "from-rose-500 to-orange-600",
      titulo: "Desafio contra o robô",
      desc: `Chegue antes dele! ${prog.desafios ? `Seu melhor: ${prog.melhorDesafioPpm} ppm.` : "Nível ajustado ao seu ano."}`,
      acao: iniciarDesafio,
    },
  ];
  return (
    <div className="relative overflow-hidden rounded-2xl border border-sky-300/20 bg-slate-950 text-white shadow-2xl shadow-sky-950/30">
      <div
        className="absolute inset-0 scale-[1.02] bg-cover bg-[68%_center] opacity-55"
        style={{ backgroundImage: "url(/images/jogos/digitacao-capa-pro.webp)" }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-950/35" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/35 to-slate-950" />
      <div className="relative flex min-h-[390px] flex-col gap-3 p-3 sm:min-h-[420px] sm:p-5">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <span className="rounded-2xl border border-cyan-300/20 bg-slate-950/55 p-1.5 shadow-lg shadow-cyan-950/50 backdrop-blur-md">
            <Teco humor="animado" className="size-11 shrink-0 sm:size-16" />
          </span>
          <div className="min-w-0">
            <span className="mb-1 inline-flex max-w-full whitespace-nowrap rounded-full border border-cyan-300/25 bg-cyan-300/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.07em] text-cyan-200 sm:text-[9px] sm:tracking-[0.18em]">
              Treinamento interativo
            </span>
            <h3 className="text-xl font-black uppercase italic leading-none tracking-tight sm:text-3xl">
              <span className="bg-gradient-to-b from-white to-sky-300 bg-clip-text text-transparent">
                Escola de Digitação
              </span>
            </h3>
            <p className="mt-1 text-[11px] leading-snug text-slate-300 sm:text-xs">
              {primeiroNome
                ? `Oi, ${primeiroNome}! Vamos aprender a digitar direitinho?`
                : "Digite, aprenda, evolua! Eu sou o Teco, seu tutor."}
            </p>
          </div>
        </div>

        {serieLogada === null ? (
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="font-semibold text-slate-300">Em que ano você está?</span>
            {([1, 2, 3, 4, 5] as Serie[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSerieEscolhida(s)}
                aria-pressed={serie === s}
                className={cn(
                  "h-8 cursor-pointer rounded-full border px-3 font-bold transition-colors",
                  serie === s
                    ? "border-sky-300 bg-sky-400 text-sky-950"
                    : "border-white/20 bg-white/5 text-slate-300 hover:bg-white/10",
                )}
              >
                {s}º
              </button>
            ))}
          </div>
        ) : (
          <p className="text-xs text-emerald-300">
            Trilha do {serieLogada}º ano — a sua pontuação é gravada na escola.
          </p>
        )}

        <div className="mt-auto grid gap-2 sm:grid-cols-2">
          {cartoes.map((c) => (
            <button
              key={c.titulo}
              type="button"
              onClick={c.acao}
              className={cn(
                "group flex cursor-pointer items-center gap-3 rounded-xl border border-white/15 bg-gradient-to-br p-3 text-left shadow-lg ring-1 ring-black/10 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-white/30 hover:shadow-xl active:scale-[.98]",
                c.cor,
              )}
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/20 ring-1 ring-white/20 transition-transform group-hover:scale-105">
                <c.icone className="size-6" aria-hidden />
              </span>
              <span className="min-w-0">
                <b className="block text-sm">{c.titulo}</b>
                <span className="text-[11px] leading-snug text-white/85">{c.desc}</span>
              </span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setTela("ranking")}
          className="flex h-9 w-fit cursor-pointer items-center gap-1.5 self-center rounded-lg border border-white/20 px-3 text-xs font-semibold text-slate-200 hover:bg-white/10"
        >
          <Trophy className="size-4 text-amber-400" /> Ver ranking de digitação
        </button>
        <p className="flex items-center justify-center gap-1 text-[10px] text-slate-500">
          <Keyboard className="size-3" aria-hidden /> Use um teclado de verdade sempre que puder.
        </p>
      </div>
    </div>
  );
}
