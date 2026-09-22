import { Check, Copy, Eye, Lightbulb, Printer, Sparkles, Trash2 } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import {
  CATEGORIAS,
  generosDaSerie,
  metaDeFrases,
  palavrasDe,
  SERIES,
  type Categoria,
  type Genero,
  type Serie,
} from "@/components/school/ferramentas/producao-textual-dados";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Assistente de produção textual: acompanha a criança nas três coisas que
 * ela precisa fazer para escrever — planejar, escrever e revisar —, em vez
 * de só dar uma folha em branco.
 *
 * Tudo se ajusta à série escolhida: os gêneros oferecidos, o nível das
 * palavras de apoio e a meta de frases. Um 1º ano vê bilhete, recado e
 * história com palavras simples; um 5º ano vê também comunicado e texto de
 * opinião, com "portanto" e "no entanto" no banco.
 *
 * O texto fica só no navegador de quem escreveu: a ferramenta é aberta ao
 * público e não guarda nada em nome de aluno nenhum.
 */

type Etapa = "escolher" | "planejar" | "escrever" | "revisar";

const ETAPAS: { id: Etapa; nome: string }[] = [
  { id: "escolher", nome: "1. Escolher" },
  { id: "planejar", nome: "2. Planejar" },
  { id: "escrever", nome: "3. Escrever" },
  { id: "revisar", nome: "4. Revisar" },
];

function contarPalavras(t: string): number {
  return t.trim() ? t.trim().split(/\s+/).length : 0;
}

function contarFrases(t: string): number {
  return t.split(/[.!?]+/).filter((f) => f.trim().length > 1).length;
}

function contarParagrafos(t: string): number {
  return t.split(/\n{2,}/).filter((p) => p.trim()).length;
}

export function ProducaoTextual() {
  const [serie, setSerie] = useState<Serie>(3);
  const [genero, setGenero] = useState<Genero | null>(null);
  const [etapa, setEtapa] = useState<Etapa>("escolher");
  const [respostas, setRespostas] = useState<string[]>([]);
  const [texto, setTexto] = useState("");
  const [marcados, setMarcados] = useState<Set<number>>(new Set());
  const [aba, setAba] = useState<Categoria | null>(null);
  const [verModelo, setVerModelo] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  const disponiveis = useMemo(() => generosDaSerie(serie), [serie]);
  const meta = metaDeFrases(serie);
  const frases = contarFrases(texto);

  function escolher(g: Genero) {
    setGenero(g);
    setRespostas(new Array(g.perguntas.length).fill(""));
    setTexto("");
    setMarcados(new Set());
    setAba(g.categorias[0] ?? null);
    setVerModelo(false);
    setEtapa("planejar");
  }

  function trocarSerie(s: Serie) {
    setSerie(s);
    // O gênero pode não existir na nova série (dissertação no 2º ano, por
    // exemplo): nesse caso volta para a escolha em vez de ficar num estado torto.
    if (genero && genero.serieMinima > s) {
      setGenero(null);
      setEtapa("escolher");
    }
  }

  /** Põe a palavra onde o cursor está — é o que a criança espera ao clicar. */
  function inserir(palavra: string) {
    const area = areaRef.current;
    if (!area) {
      setTexto((t) => `${t}${palavra} `);
      return;
    }
    const ini = area.selectionStart;
    const fim = area.selectionEnd;
    const antes = texto.slice(0, ini);
    const depois = texto.slice(fim);
    const espaco = antes && !antes.endsWith(" ") && !antes.endsWith("\n") ? " " : "";
    const novo = `${antes}${espaco}${palavra} ${depois}`;
    setTexto(novo);
    window.setTimeout(() => {
      area.focus();
      const pos = (antes + espaco + palavra + " ").length;
      area.setSelectionRange(pos, pos);
    }, 0);
  }

  /** O planejamento vira um rascunho: cada resposta é uma linha para melhorar. */
  function usarPlanejamento() {
    const linhas = respostas.filter((r) => r.trim());
    if (!linhas.length) return;
    setTexto((t) => (t ? t : linhas.join("\n\n")));
    setEtapa("escrever");
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Sem permissão de área de transferência: o texto continua na tela.
    }
  }

  function imprimir() {
    const janela = window.open("", "_blank", "width=800,height=600");
    if (!janela) return;
    const titulo = genero ? genero.nome : "Meu texto";
    janela.document.write(
      `<!doctype html><meta charset="utf-8"><title>${titulo}</title>` +
        `<style>body{font:16px/1.8 Georgia,serif;margin:3cm;color:#23231f}` +
        `h1{font-size:19px;border-bottom:1px solid #999;padding-bottom:6px;margin-bottom:18px}` +
        `p{text-indent:2em;text-align:justify;margin:0 0 .6em;white-space:pre-line}</style>` +
        `<h1>${titulo}</h1>` +
        texto
          .split(/\n{2,}/)
          .map(
            (par) =>
              `<p>${par
                .trim()
                .replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c]!)}</p>`,
          )
          .join(""),
    );
    janela.document.close();
    janela.print();
  }

  /* --------------------------- cabeçalho --------------------------- */

  const cabecalho = (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-muted-foreground">Estou no</span>
        {SERIES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => trocarSerie(s.id)}
            className={cn(
              "cursor-pointer rounded-full border px-2.5 py-0.5 text-xs transition-colors",
              serie === s.id
                ? "border-primary bg-primary/10 font-medium text-primary"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {s.nome}
          </button>
        ))}
      </div>
      {genero && (
        <div className="flex gap-1 rounded-lg bg-muted/60 p-1">
          {ETAPAS.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => setEtapa(e.id)}
              className={cn(
                "flex-1 cursor-pointer rounded-md px-1 py-1.5 text-[11px] font-medium transition-colors",
                etapa === e.id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {e.nome}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  /* --------------------------- 1. escolher ------------------------- */

  if (!genero || etapa === "escolher") {
    return (
      <div className="flex flex-col gap-3">
        {cabecalho}
        <p className="text-xs text-muted-foreground">
          O que você vai escrever hoje? Aparecem só os textos do seu ano.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {disponiveis.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => escolher(g)}
              className="flex cursor-pointer flex-col gap-0.5 rounded-xl border border-border bg-background p-2.5 text-left transition-colors hover:border-primary/60 hover:bg-primary/5"
            >
              <span className="text-sm font-semibold text-foreground">
                <span aria-hidden>{g.emoji}</span> {g.nome}
              </span>
              <span className="text-[11px] leading-tight text-muted-foreground">{g.paraQue}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  /* --------------------------- 2. planejar ------------------------- */

  if (etapa === "planejar") {
    return (
      <div className="flex flex-col gap-2">
        {cabecalho}

        <div className="rounded-xl border border-border bg-background p-2">
          <p className="text-sm font-semibold text-foreground">
            <span aria-hidden>{genero.emoji}</span> {genero.nome}
          </p>
          <p className="text-[11px] leading-tight text-muted-foreground">
            {genero.paraQue} <b>Quem lê:</b> {genero.quemLe}
          </p>
        </div>

        {/* Duas colunas: a estrutura fica sempre à vista e, do lado, ou as
          perguntas do plano ou o exemplo pronto — um no lugar do outro, para
          a janela não crescer. */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-semibold text-foreground">
              O que este texto tem dentro
            </p>
            <ol className="flex flex-col gap-0.5">
              {genero.partes.map((p, i) => (
                <li
                  key={p.nome}
                  className="flex gap-1.5 rounded-lg bg-muted/40 p-1 text-[11px] leading-tight"
                >
                  <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[9px] font-bold text-primary">
                    {i + 1}
                  </span>
                  <span>
                    <b className="text-foreground">{p.nome}:</b>{" "}
                    <span className="text-muted-foreground">{p.oQue}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-foreground">
                {verModelo
                  ? `Exemplo de ${genero.nome.toLowerCase()}`
                  : "Responda antes de escrever"}
              </p>
              <button
                type="button"
                onClick={() => setVerModelo((v) => !v)}
                className="flex shrink-0 cursor-pointer items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
              >
                <Eye className="size-3" /> {verModelo ? "voltar" : "ver exemplo"}
              </button>
            </div>

            {verModelo ? (
              <div className="max-h-[190px] overflow-auto rounded-xl border border-border bg-muted/40 p-2">
                <p className="whitespace-pre-wrap text-[11px] leading-relaxed text-foreground">
                  {genero.modelo}
                </p>
              </div>
            ) : (
              genero.perguntas.map((q, i) => (
                <label key={q.rotulo} className="flex flex-col gap-0.5">
                  <span className="text-[11px] leading-tight text-muted-foreground">
                    {q.rotulo}
                  </span>
                  <input
                    value={respostas[i] ?? ""}
                    onChange={(e) =>
                      setRespostas((r) => r.map((v, j) => (j === i ? e.target.value : v)))
                    }
                    placeholder={q.dica}
                    className="h-7 rounded-lg border border-border bg-background px-2 text-xs text-foreground"
                  />
                </label>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border-dashed border-border p-1.5">
          <p className="mb-1 flex items-center gap-1 text-[11px] font-semibold text-foreground">
            <Lightbulb className="size-3.5 text-amber-500" /> Sem ideia? Pode ser sobre:
          </p>
          <ul className="flex flex-wrap gap-1">
            {genero.ideias.map((ideia) => (
              <li
                key={ideia}
                className="rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
              >
                {ideia}
              </li>
            ))}
          </ul>
        </div>

        <Button
          size="sm"
          className="h-8 cursor-pointer self-center text-xs"
          onClick={usarPlanejamento}
        >
          <Sparkles className="size-3.5" /> Começar a escrever
        </Button>
      </div>
    );
  }

  /* --------------------------- 3. escrever ------------------------- */

  if (etapa === "escrever") {
    const categorias = CATEGORIAS.filter((c) => genero.categorias.includes(c.id));
    const abaAtual = aba ?? categorias[0]?.id ?? "tempo";
    const palavras = palavrasDe(abaAtual, serie);

    return (
      <div className="flex flex-col gap-2">
        {cabecalho}

        {/* A folha: papel claro, letra serifada e entrelinha larga. Escrever
          numa caixinha apertada de formulário faz o texto parecer recado;
          escrever numa folha faz a criança tratar aquilo como texto. */}
        <div className="overflow-hidden rounded-xl border border-border bg-[#fdfcf7] shadow-sm dark:bg-[#f5f2ea]">
          <div className="flex items-center justify-between border-b border-[#e7e2d6] bg-[#f6f2e8] px-3 py-1">
            <span className="truncate text-[11px] font-semibold text-[#6b6a63]">
              {genero.emoji} {genero.nome}
            </span>
            <span className="text-[10px] text-[#8a887e]">
              {contarPalavras(texto)} {contarPalavras(texto) === 1 ? "palavra" : "palavras"}
            </span>
          </div>
          <textarea
            ref={areaRef}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={`Escreva seu ${genero.nome.toLowerCase()} aqui...`}
            aria-label="Seu texto"
            spellCheck
            className="min-h-[136px] w-full resize-y border-0 bg-transparent px-4 py-3 font-serif text-[15px] leading-[1.75] text-[#23231f] outline-none placeholder:text-[#a8a69c] focus:ring-0"
          />
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          <span>
            {contarParagrafos(texto)} {contarParagrafos(texto) === 1 ? "parágrafo" : "parágrafos"}
          </span>
          <span
            className={cn(frases >= meta && "font-semibold text-emerald-600 dark:text-emerald-400")}
          >
            {frases} de {meta} frases
          </span>
          <div className="h-1.5 min-w-[60px] flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.min(100, (frases / meta) * 100)}%` }}
            />
          </div>
        </div>

        {/* Banco de palavras */}
        <div className="rounded-xl border border-border bg-background p-2">
          <div className="mb-1.5 flex flex-wrap gap-1">
            {categorias.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setAba(c.id)}
                className={cn(
                  "cursor-pointer rounded-md border px-1.5 py-0.5 text-[10px] transition-colors",
                  abaAtual === c.id
                    ? "border-primary bg-primary/10 font-medium text-primary"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {c.nome}
              </button>
            ))}
          </div>
          <p className="mb-1.5 text-[10px] text-muted-foreground">
            Serve para {CATEGORIAS.find((c) => c.id === abaAtual)?.paraQue}. Toque numa palavra para
            pôr no texto.
          </p>
          <div className="flex max-h-[112px] flex-col gap-1 overflow-auto">
            {palavras.map((p) => (
              <button
                key={p.palavra}
                type="button"
                onClick={() => inserir(p.palavra)}
                className="cursor-pointer rounded-lg border border-border bg-muted/30 p-1.5 text-left transition-colors hover:border-primary/60 hover:bg-primary/5"
              >
                <span className="text-xs font-semibold text-primary">{p.palavra}</span>
                <span className="block text-[10px] leading-tight text-muted-foreground">
                  {p.significado}
                </span>
                <span className="block text-[10px] italic leading-tight text-muted-foreground/80">
                  {p.exemplo}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 cursor-pointer text-xs"
            onClick={() => setEtapa("planejar")}
          >
            Ver o plano
          </Button>
          <Button
            size="sm"
            className="h-8 cursor-pointer text-xs"
            onClick={() => setEtapa("revisar")}
          >
            Revisar meu texto
          </Button>
        </div>
      </div>
    );
  }

  /* --------------------------- 4. revisar -------------------------- */

  const faltando = genero.checklist.length - marcados.size;

  return (
    <div className="flex flex-col gap-3">
      {cabecalho}

      {/* Na revisão o texto deixa de ser rascunho e aparece como sairia no
        papel: parágrafos separados, primeira linha recuada, justificado. */}
      <div className="max-h-[150px] overflow-auto rounded-xl border border-border bg-[#fdfcf7] px-4 py-3 shadow-sm dark:bg-[#f5f2ea]">
        {texto.trim() ? (
          <div className="space-y-2">
            {texto.split(/\n{2,}/).map((par, i) => (
              <p
                key={i}
                className="whitespace-pre-line indent-6 text-justify font-serif text-[13px] leading-[1.7] text-[#23231f] hyphens-auto"
                lang="pt-BR"
              >
                {par.trim()}
              </p>
            ))}
          </div>
        ) : (
          <p className="text-center font-serif text-xs text-[#8a887e]">
            Você ainda não escreveu nada.
          </p>
        )}
      </div>

      <div>
        <p className="mb-1 text-xs font-semibold text-foreground">Confira antes de entregar</p>
        <ul className="flex flex-col gap-1">
          {genero.checklist.map((item, i) => {
            const ok = marcados.has(i);
            return (
              <li key={item}>
                <button
                  type="button"
                  onClick={() =>
                    setMarcados((m) => {
                      const novo = new Set(m);
                      if (novo.has(i)) novo.delete(i);
                      else novo.add(i);
                      return novo;
                    })
                  }
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-2 rounded-lg border p-1.5 text-left text-[11px] transition-colors",
                    ok
                      ? "border-emerald-600/50 bg-emerald-600/10 text-foreground"
                      : "border-border bg-background text-muted-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded border",
                      ok ? "border-emerald-600 bg-emerald-600 text-white" : "border-border",
                    )}
                  >
                    {ok && <Check className="size-3" />}
                  </span>
                  {item}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <p
        className={cn(
          "rounded-xl p-2 text-center text-[11px]",
          faltando === 0
            ? "bg-emerald-600/10 font-medium text-emerald-700 dark:text-emerald-300"
            : "bg-muted text-muted-foreground",
        )}
      >
        {faltando === 0
          ? "Tudo conferido! Seu texto está pronto para entregar."
          : `Faltam ${faltando} ${faltando === 1 ? "item" : "itens"} para conferir.`}
      </p>

      <div className="flex flex-wrap justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8 cursor-pointer text-xs"
          onClick={() => setEtapa("escrever")}
        >
          Voltar a escrever
        </Button>
        <Button variant="outline" size="sm" className="h-8 cursor-pointer text-xs" onClick={copiar}>
          {copiado ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copiado ? "Copiado!" : "Copiar"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 cursor-pointer text-xs"
          onClick={imprimir}
          disabled={!texto.trim()}
        >
          <Printer className="size-3.5" /> Imprimir
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 cursor-pointer text-xs text-muted-foreground"
          onClick={() => {
            setGenero(null);
            setEtapa("escolher");
          }}
        >
          <Trash2 className="size-3.5" /> Outro texto
        </Button>
      </div>
    </div>
  );
}
