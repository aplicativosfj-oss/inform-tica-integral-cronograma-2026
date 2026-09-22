import { CheckCircle2, Lightbulb, ListOrdered, RefreshCw, XCircle } from "lucide-react";
import { useState, type ReactNode } from "react";

import {
  gerarProblema,
  NIVEIS_PROBLEMA,
  type Cenario,
  type Operacao,
  type Problema,
} from "@/components/school/ferramentas/problemas-enunciados";
import { BancadaCalculo, numerosDoTexto } from "@/components/school/ferramentas/bancada-calculo";
import { CampoResposta } from "@/components/school/ferramentas/controles";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Fábrica de problemas: o enunciado vem da `problemas-enunciados.ts`, esta
 * tela cuida de mostrar, conferir e — o mais importante — explicar.
 *
 * A criança tenta, erra, pede a dica, tenta de novo e só então abre o passo a
 * passo. É de propósito: resposta certa entregue de cara não ensina ninguém.
 */

/* ------------------------------------------------------------------ */
/* Ilustrações por cenário                                             */
/* ------------------------------------------------------------------ */

const CENA: Record<Cenario, { nome: string; desenho: ReactNode }> = {
  feira: {
    nome: "Na feira",
    desenho: (
      <>
        <rect x={14} y={54} width={92} height={40} rx={6} fill="#b45309" />
        <rect x={14} y={48} width={92} height={10} rx={4} fill="#92400e" />
        <circle cx={38} cy={40} r={13} fill="#dc2626" />
        <circle cx={62} cy={36} r={15} fill="#ea580c" />
        <circle cx={86} cy={41} r={12} fill="#16a34a" />
        <path
          d="M38 27 q3 -8 9 -9"
          stroke="#15803d"
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
        />
      </>
    ),
  },
  escola: {
    nome: "Na escola",
    desenho: (
      <>
        <rect x={18} y={30} width={84} height={54} rx={5} fill="#1e3a5f" />
        <rect x={24} y={36} width={72} height={42} rx={3} fill="#2f6f4e" />
        <path
          d="M34 50 h22 M34 60 h34 M34 70 h16"
          stroke="#ffffff"
          strokeWidth={3}
          strokeLinecap="round"
          opacity={0.85}
        />
        <rect x={22} y={86} width={76} height={8} rx={3} fill="#a16207" />
      </>
    ),
  },
  esporte: {
    nome: "No esporte",
    desenho: (
      <>
        <rect x={16} y={26} width={88} height={62} rx={4} fill="#16a34a" opacity={0.25} />
        <rect
          x={16}
          y={26}
          width={88}
          height={62}
          rx={4}
          fill="none"
          stroke="#16a34a"
          strokeWidth={2.5}
        />
        <line x1={60} y1={26} x2={60} y2={88} stroke="#16a34a" strokeWidth={2.5} />
        <circle cx={60} cy={57} r={11} fill="none" stroke="#16a34a" strokeWidth={2.5} />
        <circle cx={60} cy={57} r={8} fill="#f8fafc" stroke="#0f172a" strokeWidth={1.5} />
        <path d="M60 51 l4 4 -2 5 h-4 l-2 -5 z" fill="#0f172a" />
      </>
    ),
  },
  rio: {
    nome: "No rio",
    desenho: (
      <>
        <path d="M8 66 q14 -7 28 0 t28 0 t28 0 t18 0 v26 H8 z" fill="#0ea5e9" opacity={0.5} />
        <path d="M30 56 h60 l-9 14 H39 z" fill="#92400e" />
        <rect x={56} y={30} width={4} height={26} fill="#78350f" />
        <path d="M60 32 l22 16 H60 z" fill="#f8fafc" stroke="#94a3b8" strokeWidth={1.5} />
        <path
          d="M8 80 q12 -6 24 0 t24 0 t24 0 t18 0"
          stroke="#0284c7"
          strokeWidth={2.5}
          fill="none"
          opacity={0.7}
        />
      </>
    ),
  },
  casa: {
    nome: "Em casa",
    desenho: (
      <>
        <path d="M60 24 L104 56 H16 z" fill="#dc2626" />
        <rect x={26} y={56} width={68} height={38} rx={3} fill="#f5c16c" />
        <rect x={50} y={68} width={20} height={26} rx={2} fill="#92400e" />
        <circle cx={66} cy={82} r={2} fill="#fde68a" />
        <rect x={32} y={64} width={13} height={13} rx={2} fill="#38bdf8" />
      </>
    ),
  },
  dinheiro: {
    nome: "Com dinheiro",
    desenho: (
      <>
        <rect x={18} y={44} width={84} height={44} rx={6} fill="#15803d" />
        <rect
          x={25}
          y={51}
          width={70}
          height={30}
          rx={4}
          fill="none"
          stroke="#bbf7d0"
          strokeWidth={2}
        />
        <circle cx={60} cy={66} r={11} fill="#bbf7d0" />
        <text x={60} y={72} textAnchor="middle" fill="#15803d" className="text-[14px] font-bold">
          R$
        </text>
        <circle cx={38} cy={34} r={12} fill="#eab308" />
        <circle cx={38} cy={34} r={8} fill="none" stroke="#a16207" strokeWidth={2} />
      </>
    ),
  },
};

function Ilustracao({ cenario }: { cenario: Cenario }) {
  return (
    <svg viewBox="0 0 120 104" className="size-full" role="img" aria-label={CENA[cenario].nome}>
      {CENA[cenario].desenho}
    </svg>
  );
}

const ROTULO_OP: Record<Operacao, string> = {
  soma: "Adição",
  subtracao: "Subtração",
  multiplicacao: "Multiplicação",
  divisao: "Divisão",
  mista: "Duas contas",
};

/* ------------------------------------------------------------------ */

export function ProblemasInteligentes() {
  const [nivel, setNivel] = useState(1);
  const [filtro, setFiltro] = useState<Operacao | "todas">("todas");
  const [problema, setProblema] = useState<Problema>(() => gerarProblema(1));
  const [resposta, setResposta] = useState("");
  const [conferido, setConferido] = useState<null | boolean>(null);
  const [mostrarDica, setMostrarDica] = useState(false);
  const [mostrarPassos, setMostrarPassos] = useState(false);
  const [acertos, setAcertos] = useState(0);
  const [tentativas, setTentativas] = useState(0);

  function novo(n = nivel, f = filtro) {
    setProblema(gerarProblema(n, f === "todas" ? undefined : f));
    setResposta("");
    setConferido(null);
    setMostrarDica(false);
    setMostrarPassos(false);
  }

  function conferir() {
    if (resposta.trim() === "" || conferido === true) return;
    const v = Number(resposta.replace(",", "."));
    const certo = v === problema.resposta;
    setConferido(certo);
    // Só conta a tentativa uma vez por problema, para o placar não inflar.
    if (conferido === null) {
      setTentativas((t) => t + 1);
      if (certo) setAcertos((a) => a + 1);
    }
  }

  return (
    // gap menor: com a caixa de ferramentas aberta, cada respiro conta para
    // tudo caber numa janela só.
    <div className="flex flex-col gap-2">
      {/* Controles */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-1.5">
          {NIVEIS_PROBLEMA.map((n) => (
            <button
              key={n.id}
              type="button"
              title={n.descricao}
              onClick={() => {
                setNivel(n.id);
                novo(n.id);
              }}
              className={cn(
                "cursor-pointer rounded-full border px-3 py-1 text-xs transition-colors",
                nivel === n.id
                  ? "border-primary bg-primary/10 font-medium text-primary"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {n.nome}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground">
          {NIVEIS_PROBLEMA.find((n) => n.id === nivel)?.descricao}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {(["todas", "soma", "subtracao", "multiplicacao", "divisao", "mista"] as const).map(
            (f) => (
              <button
                key={f}
                type="button"
                onClick={() => {
                  setFiltro(f);
                  novo(nivel, f);
                }}
                className={cn(
                  "cursor-pointer rounded-md border px-2 py-0.5 text-[11px] transition-colors",
                  filtro === f
                    ? "border-foreground/40 bg-muted font-medium text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {f === "todas" ? "Todas" : ROTULO_OP[f]}
              </button>
            ),
          )}
        </div>
      </div>

      {/* Problema */}
      <div className="flex gap-3 rounded-xl border border-border bg-background p-3">
        <div className="size-[76px] shrink-0 rounded-lg bg-muted/50 p-1">
          <Ilustracao cenario={problema.cenario} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {ROTULO_OP[problema.operacao]}
          </p>
          <p className="text-sm leading-relaxed text-foreground">{problema.enunciado}</p>
        </div>
      </div>

      {/* A caixa de ferramentas já vem com os números deste problema. */}
      <BancadaCalculo numeros={numerosDoTexto(problema.enunciado)} operacao={problema.operacao} />

      {/* Resposta */}
      <div className="flex flex-wrap items-center gap-2">
        <CampoResposta
          valor={resposta}
          aoMudar={(v) => {
            setResposta(v);
            if (conferido === false) setConferido(null);
          }}
          aoTeclarEnter={conferir}
          rotulo="Sua resposta"
          placeholder="Sua resposta"
        />
        <span className="text-sm text-muted-foreground">{problema.unidade}</span>
        <Button size="sm" className="cursor-pointer" onClick={conferir} disabled={!resposta.trim()}>
          Conferir
        </Button>
        <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => novo()}>
          <RefreshCw className="size-3.5" /> Outro problema
        </Button>
      </div>

      {/* Devolutiva */}
      {conferido !== null && (
        <p
          className={cn(
            "flex items-center gap-2 rounded-xl p-2.5 text-sm font-medium",
            conferido
              ? "bg-emerald-600/10 text-emerald-700 dark:text-emerald-300"
              : "bg-destructive/10 text-destructive",
          )}
        >
          {conferido ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
          {conferido
            ? `Isso! São ${problema.resposta} ${problema.unidade}.`
            : "Ainda não. Veja a dica e tente de novo."}
        </p>
      )}

      {/* Ajudas */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8 cursor-pointer text-xs"
          onClick={() => setMostrarDica((v) => !v)}
        >
          <Lightbulb className="size-3.5" /> {mostrarDica ? "Esconder a dica" : "Dica"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 cursor-pointer text-xs"
          onClick={() => setMostrarPassos((v) => !v)}
        >
          <ListOrdered className="size-3.5" />{" "}
          {mostrarPassos ? "Esconder a resolução" : "Ver como resolve"}
        </Button>
      </div>

      {mostrarDica && (
        <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-2.5 text-xs text-foreground">
          {problema.dica}
        </p>
      )}

      {mostrarPassos && (
        <ol className="flex flex-col gap-1.5 rounded-xl border border-border bg-muted/40 p-3">
          {problema.passos.map((passo, i) => (
            <li key={i} className="flex gap-2 text-xs text-foreground">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
                {i + 1}
              </span>
              {passo}
            </li>
          ))}
          <li className="mt-1 border-t border-border pt-2 text-xs font-semibold text-foreground">
            Resposta: {problema.resposta} {problema.unidade}
          </li>
        </ol>
      )}

      {tentativas > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          Você acertou <b className="text-foreground">{acertos}</b> de {tentativas}{" "}
          {tentativas === 1 ? "problema" : "problemas"} nesta sessão.
        </p>
      )}
    </div>
  );
}
