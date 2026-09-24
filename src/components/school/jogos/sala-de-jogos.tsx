import { ArrowLeft, Bot, Loader2, Maximize2, Star, Trophy, Users } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useEffect, useState, type ComponentType } from "react";

import { Corrida } from "@/components/school/jogos/corrida";
import { Damas } from "@/components/school/jogos/damas";
import { Digitacao } from "@/components/school/jogos/digitacao";
import { Domino } from "@/components/school/jogos/domino";
import { JogoDaOnca } from "@/components/school/jogos/jogo-da-onca";
import { JogoDaVelha } from "@/components/school/jogos/jogo-da-velha";
import { Memoria } from "@/components/school/jogos/memoria";
import { BotaoCompartilhar } from "@/components/school/botao-compartilhar";
import { CaixaJogo } from "@/components/school/jogos/tela-cheia";
import { QuebraCabeca } from "@/components/school/jogos/quebra-cabeca";
import { TabuleiroMatematica } from "@/components/school/jogos/tabuleiro-matematica";
import { lerAlunoSessao } from "@/lib/aluno-session";
import { lerCarteira, somarPorAluno, type Adversario, type LinhaRanking } from "@/lib/estrelas";
import { fetchRanking } from "@/lib/placares";
import { IMAGENS_CORRIDA, IMAGENS_DIGITACAO, precarregar } from "@/lib/precarregar";
import { cn } from "@/lib/utils";

/**
 * Sala de Jogos: cinco jogos de mesa, cada um com adversário de verdade.
 *
 * O caminho é sempre o mesmo — escolher o jogo, escolher contra quem e em que
 * nível — porque criança não deve ter que reaprender a interface a cada jogo.
 * Todos pagam na mesma moeda, as estrelas, e quem está logado entra no
 * ranking da escola.
 *
 * Dois jogos não têm computador adversário: no quebra-cabeça e no jogo da
 * memória sozinho, o adversário é o próprio tabuleiro.
 */

export interface JogoInfo {
  id: string;
  nome: string;
  emoji: string;
  descricao: string;
  Componente: ComponentType<{ adversario: Adversario; nivel: number }>;
  /** Contra quem dá para jogar. */
  modos: Adversario[];
  niveis: string[];
}

export const JOGOS: JogoInfo[] = [
  {
    id: "onca",
    nome: "Jogo da Onça",
    emoji: "🐆",
    descricao:
      "Adugo, jogo tradicional indígena: 1 onça contra 14 cachorros. Pule, cerque e capture!",
    Componente: JogoDaOnca,
    modos: ["computador", "colega"],
    niveis: ["Fácil", "Médio", "Difícil"],
  },
  {
    id: "jogo-da-velha",
    nome: "Jogo da velha",
    emoji: "⭕",
    descricao: "Três em linha. No difícil, o computador não perde nunca.",
    Componente: JogoDaVelha,
    modos: ["computador", "colega"],
    niveis: ["Fácil", "Médio", "Difícil"],
  },
  {
    id: "damas",
    nome: "Damas",
    emoji: "⚫",
    descricao: "Tabuleiro 8×8, captura obrigatória e coroação de dama.",
    Componente: Damas,
    modos: ["computador", "colega"],
    niveis: ["Fácil", "Médio", "Difícil"],
  },
  {
    id: "domino",
    nome: "Dominó",
    emoji: "🁡",
    descricao: "As 28 pedras, com compra no monte e jogo trancado.",
    Componente: Domino,
    modos: ["computador"],
    niveis: ["Fácil", "Esperto"],
  },
  {
    id: "memoria",
    nome: "Jogo da memória",
    emoji: "🃏",
    descricao: "Ache os pares. Cada carta virada fala a palavra.",
    Componente: Memoria,
    modos: ["colega", "computador"],
    niveis: ["6 pares", "8 pares", "10 pares"],
  },
  {
    id: "quebra-cabeca",
    nome: "Quebra-cabeça",
    emoji: "🧩",
    descricao: "Deslize as peças até a figura aparecer inteira.",
    Componente: QuebraCabeca,
    modos: ["computador"],
    niveis: ["3 × 3", "4 × 4", "5 × 5"],
  },
  {
    id: "tabuleiro-matematica",
    nome: "Matemática em Ação",
    emoji: "🎲",
    descricao: "Tabuleiro com dado e cartas de conta, desafio e pense rápido.",
    Componente: TabuleiroMatematica,
    modos: ["computador", "colega"],
    niveis: ["Fácil", "Médio", "Difícil"],
  },
  {
    id: "digitacao",
    nome: "Digitação",
    emoji: "⌨️",
    descricao: "Escola com tutor, fases por ano, lições e desafio contra o robô.",
    Componente: Digitacao,
    modos: ["computador"],
    niveis: ["Fácil", "Médio", "Difícil"],
  },
  {
    id: "corrida",
    nome: "Corrida",
    emoji: "🏎️",
    descricao: "Três voltas, cinco pistas, som e música. Volante de arrastar no celular.",
    Componente: Corrida,
    modos: ["computador"],
    niveis: ["Fácil", "Médio", "Difícil"],
  },
];

function Ranking() {
  const [linhas, setLinhas] = useState<LinhaRanking[] | null>(null);
  const [local, setLocal] = useState(false);

  useEffect(() => {
    let vivo = true;
    void fetchRanking("sala-de-jogos").then((r) => {
      if (!vivo) return;
      setLinhas(somarPorAluno(r.placares));
      setLocal(r.somenteLocal);
    });
    return () => {
      vivo = false;
    };
  }, []);

  if (linhas === null) {
    return (
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin" /> carregando o ranking…
      </p>
    );
  }
  if (!linhas.length) {
    return (
      <p className="rounded-xl border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
        Ninguém no ranking ainda. Ganhe uma partida para aparecer aqui!
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {linhas.slice(0, 8).map((l, i) => (
        <div
          key={l.aluno}
          className={cn(
            "flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs",
            i === 0 ? "border-amber-500/50 bg-amber-500/10" : "border-border bg-card",
          )}
        >
          <span className="w-5 text-center font-bold text-muted-foreground">{i + 1}</span>
          <span className="min-w-0 flex-1 truncate font-medium text-foreground">{l.aluno}</span>
          <span className="text-muted-foreground">{l.partidas} partidas</span>
          <span className="flex w-16 items-center justify-end gap-1 font-bold text-amber-600 dark:text-amber-400">
            <Star className="size-3.5 fill-current" /> {l.estrelas}
          </span>
        </div>
      ))}
      {local && (
        <p className="text-[11px] text-muted-foreground">
          Mostrando só as partidas deste computador.
        </p>
      )}
    </div>
  );
}

export function SalaDeJogos({ jogoInicial }: { jogoInicial?: string } = {}) {
  const [jogo, setJogo] = useState<JogoInfo | null>(
    () => JOGOS.find((j) => j.id === jogoInicial) ?? null,
  );
  const [adversario, setAdversario] = useState<Adversario>("computador");
  const [nivel, setNivel] = useState(2);
  const [verRanking, setVerRanking] = useState(false);
  const [cheia, setCheia] = useState(false);
  const [carteira, setCarteira] = useState(() => lerCarteira());
  const sessao = lerAlunoSessao();

  // Assim que a Sala abre, as imagens dos jogos já começam a baixar (digitação primeiro).
  useEffect(() => {
    precarregar(IMAGENS_DIGITACAO);
    const t = window.setTimeout(() => precarregar(IMAGENS_CORRIDA), 600);
    return () => window.clearTimeout(t);
  }, []);

  // Ao voltar de uma partida, as estrelas novas já aparecem no topo.
  useEffect(() => {
    if (!jogo) setCarteira(lerCarteira());
  }, [jogo]);

  if (jogo) {
    const Componente = jogo.Componente;
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              setJogo(null);
              setCheia(false);
            }}
            className="flex h-9 cursor-pointer items-center gap-1 rounded-lg px-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> sala de jogos
          </button>
          <span className="hidden text-xs font-bold text-foreground sm:block">
            {jogo.emoji} {jogo.nome} · {jogo.niveis[nivel - 1]} ·{" "}
            {adversario === "computador" ? "contra o computador" : "contra um colega"}
          </span>
          <BotaoCompartilhar
            caminho={`/jogos/${jogo.id}`}
            titulo={`${jogo.nome} · Sala de Jogos`}
            texto={jogo.descricao}
            className="border-border bg-card text-foreground hover:border-primary"
          />
          <button
            type="button"
            onClick={() => setCheia(true)}
            className="flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-semibold text-foreground hover:border-primary"
          >
            <Maximize2 className="size-4" /> Tela cheia
          </button>
        </div>
        <CaixaJogo
          cheia={cheia}
          aoSair={() => setCheia(false)}
          aoFechar={() => {
            setJogo(null);
            setCheia(false);
          }}
          titulo={`${jogo.emoji} ${jogo.nome}`}
          compartilhar={{
            caminho: `/jogos/${jogo.id}`,
            titulo: `${jogo.nome} · Sala de Jogos`,
            texto: jogo.descricao,
          }}
          horizontal={jogo.id === "corrida"}
        >
          <Componente
            key={`${jogo.id}-${adversario}-${nivel}`}
            adversario={adversario}
            nivel={nivel}
          />
        </CaixaJogo>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2">
        <span className="flex items-center gap-1.5 text-sm font-bold text-amber-700 dark:text-amber-300">
          <Star className="size-4 fill-current" /> {carteira.total}{" "}
          {carteira.total === 1 ? "estrela" : "estrelas"}
        </span>
        <button
          type="button"
          onClick={() => setVerRanking((v) => !v)}
          className="flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 text-xs font-semibold text-foreground"
        >
          <Trophy className="size-3.5" /> {verRanking ? "esconder" : "ranking"}
        </button>
      </div>

      {verRanking && <Ranking />}

      {!sessao && (
        <p className="rounded-lg bg-muted/60 px-3 py-1.5 text-[11px] text-muted-foreground">
          Você está jogando sem entrar na sua conta: as estrelas ficam só neste computador. Entre
          com seu PIN na Área do Aluno para aparecer no ranking da escola.
        </p>
      )}

      {/* Contra quem e em que nível — vale para o jogo que escolher depois */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-lg bg-muted/60 p-1">
          {(
            [
              ["computador", "Contra o computador", Bot],
              ["colega", "Contra um colega", Users],
            ] as const
          ).map(([id, rotulo, Icone]) => (
            <button
              key={id}
              type="button"
              onClick={() => setAdversario(id)}
              className={cn(
                "flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                adversario === id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icone className="size-3.5" />
              {rotulo}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {[1, 2, 3].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setNivel(n)}
              className={cn(
                "cursor-pointer rounded-full border px-2.5 py-1 text-xs transition-colors",
                nivel === n
                  ? "border-primary bg-primary/10 font-semibold text-primary"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {n === 1 ? "Fácil" : n === 2 ? "Médio" : "Difícil"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {JOGOS.map((j) => {
          const serve = j.modos.includes(adversario);
          const minhas = carteira.porJogo[j.id];
          return (
            <button
              key={j.id}
              type="button"
              disabled={!serve}
              onClick={() => {
                setJogo(j);
                // Todo jogo abre em tela cheia (o clique é o gesto que o navegador exige):
                // a partida não fica redimensionando com a janela.
                setCheia(true);
              }}
              className={cn(
                "flex flex-col items-start gap-0.5 rounded-2xl border-2 p-2.5 text-left transition-colors",
                serve
                  ? "cursor-pointer border-border bg-card hover:border-primary hover:bg-primary/5"
                  : "border-dashed border-border bg-muted/30 opacity-60",
              )}
            >
              <span className="flex w-full items-center justify-between">
                <span className="text-sm font-bold text-foreground">
                  <span aria-hidden>{j.emoji}</span> {j.nome}
                </span>
                {minhas && minhas.estrelas > 0 && (
                  <span className="flex items-center gap-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                    <Star className="size-3 fill-current" />
                    {minhas.estrelas}
                  </span>
                )}
              </span>
              <span className="text-[11px] leading-tight text-muted-foreground">
                {serve
                  ? j.descricao
                  : `Este só tem ${j.modos.includes("computador") ? "contra o computador" : "contra um colega"}.`}
              </span>
              {minhas && (
                <span className="text-[10px] text-muted-foreground">
                  {minhas.vitorias} {minhas.vitorias === 1 ? "vitória" : "vitórias"} em{" "}
                  {minhas.partidas}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Jogo da equipe: tem tela e controles próprios, então abre em página cheia */}
      <Link
        to="/operacao-plantao"
        className="group relative flex min-h-28 items-end overflow-hidden rounded-2xl border-2 border-amber-500/60 bg-slate-950 p-3 text-left transition-colors hover:border-amber-400"
      >
        <img
          src="/images/plantao/menu-fundo.webp"
          alt=""
          loading="lazy"
          className="absolute inset-0 size-full object-cover opacity-70 transition-transform duration-300 group-hover:scale-105"
        />
        <span className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
        <span className="relative flex flex-col gap-0.5">
          <span className="text-sm font-black uppercase tracking-wide text-amber-300">
            🚔 Operação: Plantão
          </span>
          <span className="text-[11px] leading-tight text-slate-200">
            Três agentes, seis missões: pegue o cachorro, entregue marmitas, corra de moto e
            maratona. Com som, para celular e computador.
          </span>
        </span>
      </Link>
    </div>
  );
}
