import type { Exemplo } from "@/components/school/ferramentas/generos-exemplos";

/**
 * A moldura de cada gênero: o suporte onde ele vive no mundo.
 *
 * Um conto numa caixa branca qualquer é "texto". O mesmo conto na folha
 * pautada, com a margem vermelha do caderno, é um conto — e a criança
 * reconhece antes de ler a primeira palavra. É por isso que cada exemplo
 * aqui é desenhado dentro do seu suporte: a tela do celular com os balões, o
 * rótulo com a tabela nutricional, a bula com as seções, a página do jornal
 * em duas colunas, a placa de trânsito.
 *
 * Tudo em HTML e CSS com um pouco de SVG: escala, funciona no claro e no
 * escuro e o texto continua sendo texto (dá para ler em voz alta, copiar e
 * ouvir com leitor de tela).
 */

function Linhas({ linhas, classe = "" }: { linhas: string[]; classe?: string }) {
  return (
    <>
      {linhas.map((l, i) =>
        l === "" ? (
          <div key={i} className="h-2" />
        ) : (
          <p key={i} className={`leading-snug ${classe}`}>
            {l}
          </p>
        ),
      )}
    </>
  );
}

/* --------------------------- folha de papel ------------------------- */

function Papel({ e }: { e: Exemplo }) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-[#fdfcf7] p-3 pl-6 text-[#2a2a28] shadow-sm dark:bg-[#f4f1e8]">
      {/* margem do caderno */}
      <div className="absolute inset-y-0 left-4 w-px bg-red-400/60" />
      <div className="absolute inset-y-0 left-[18px] w-px bg-red-400/30" />
      {e.titulo && <p className="mb-1.5 font-serif text-sm font-bold">{e.titulo}</p>}
      <div className="space-y-0.5 font-serif text-[12px]">
        <Linhas linhas={e.linhas ?? []} />
      </div>
      {e.assinatura && (
        <p className="mt-2 text-right font-serif text-[10px] italic text-[#6b6a63]">
          {e.assinatura}
        </p>
      )}
    </div>
  );
}

/* ----------------------------- celular ------------------------------ */

function Celular({ e }: { e: Exemplo }) {
  return (
    <div className="mx-auto w-full max-w-[280px] overflow-hidden rounded-[18px] border-[6px] border-[#1f2937] bg-[#e5ddd5] shadow-lg dark:bg-[#0b141a]">
      <div className="flex items-center gap-2 bg-[#075e54] px-2.5 py-1.5">
        <div className="flex size-6 items-center justify-center rounded-full bg-white/25 text-[10px] text-white">
          {(e.titulo ?? "?").slice(0, 1)}
        </div>
        <span className="truncate text-[11px] font-semibold text-white">{e.titulo}</span>
      </div>
      <div className="flex flex-col gap-1 p-2">
        {(e.mensagens ?? []).map((m, i) => (
          <div key={i} className={`flex ${m.de === "eu" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-lg px-2 py-1 text-[11px] leading-snug shadow-sm ${
                m.de === "eu"
                  ? "rounded-tr-none bg-[#dcf8c6] text-[#1f2c33]"
                  : "rounded-tl-none bg-white text-[#1f2c33]"
              }`}
            >
              {m.txt}
              <span className="ml-1.5 align-bottom text-[8px] text-[#667781]">{m.hora}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------ rótulo ------------------------------ */

function Rotulo({ e }: { e: Exemplo }) {
  return (
    <div className="overflow-hidden rounded-lg border-2 border-[#1c6b3f] bg-white text-[#14261c] shadow-sm">
      <div className="bg-[#1c6b3f] px-3 py-2 text-white">
        <p className="text-[10px] uppercase tracking-wider opacity-80">{e.assinatura}</p>
        <p className="text-base font-extrabold leading-tight">{e.titulo}</p>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-0.5 border-b border-dashed border-[#1c6b3f]/30 px-3 py-1.5 text-[10px]">
        {(e.campos ?? []).map((c) => (
          <span key={c.rotulo}>
            <b>{c.rotulo}:</b> {c.valor}
          </span>
        ))}
      </div>
      <div className="space-y-2 p-3">
        {(e.secoes ?? []).map((s) => (
          <div key={s.titulo}>
            <p className="text-[10px] font-bold uppercase tracking-wide">{s.titulo}</p>
            {s.titulo.toLowerCase().includes("nutricional") ? (
              <table className="mt-1 w-full border-collapse text-[10px]">
                <tbody>
                  {s.linhas.map((l) => {
                    const [a, b] = l.split(":");
                    return (
                      <tr key={l} className="border-b border-[#14261c]/15">
                        <td className="py-0.5">{a}</td>
                        <td className="py-0.5 text-right font-semibold">{b}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p className="text-[11px] leading-snug">{s.linhas.join(" ")}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------- bula ------------------------------- */

function Bula({ e }: { e: Exemplo }) {
  return (
    <div className="rounded-lg border border-border bg-[#fbfbfb] p-3 text-[#222] shadow-sm">
      <p className="border-b-2 border-[#1b4f9c] pb-1 text-sm font-bold text-[#1b4f9c]">
        {e.titulo}
      </p>
      <div className="mt-2 space-y-2">
        {(e.secoes ?? []).map((s) => (
          <div key={s.titulo}>
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#1b4f9c]">
              {s.titulo}
            </p>
            <div className="space-y-0.5 text-[10.5px] leading-snug">
              <Linhas linhas={s.linhas} />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-2 border-t border-dashed border-[#999] pt-1 text-center text-[9px] font-bold uppercase text-[#b91c1c]">
        Siga corretamente o modo de usar
      </p>
    </div>
  );
}

/* ------------------------------ jornal ------------------------------ */

function Jornal({ e }: { e: Exemplo }) {
  return (
    <div className="rounded-lg border border-border bg-[#f7f5f0] p-3 text-[#1c1c1a] shadow-sm">
      <p className="border-b border-[#1c1c1a] pb-1 text-center text-[9px] font-bold uppercase tracking-[0.2em]">
        Gazeta do Envira
      </p>
      <p className="mt-2 font-serif text-base font-bold leading-tight">{e.titulo}</p>
      {e.assinatura && (
        <p className="mt-0.5 text-[9px] uppercase tracking-wide text-[#6b6a63]">{e.assinatura}</p>
      )}
      <div className="mt-1.5 space-y-1 text-justify font-serif text-[11px] leading-snug sm:columns-2 sm:gap-3">
        <Linhas linhas={e.linhas ?? []} />
      </div>
    </div>
  );
}

/* ------------------------------- blog ------------------------------- */

function Blog({ e }: { e: Exemplo }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="flex items-center gap-1.5 border-b border-border bg-muted/60 px-2 py-1">
        <span className="size-2 rounded-full bg-red-400" />
        <span className="size-2 rounded-full bg-amber-400" />
        <span className="size-2 rounded-full bg-emerald-400" />
        <span className="ml-1 flex-1 truncate rounded bg-background px-2 py-0.5 text-[9px] text-muted-foreground">
          https://hortadaescola.blog.br
        </span>
      </div>
      <div className="p-3">
        <p className="text-sm font-bold leading-tight text-foreground">{e.titulo}</p>
        {e.assinatura && <p className="mt-0.5 text-[10px] text-muted-foreground">{e.assinatura}</p>}
        <div className="mt-1.5 space-y-1 text-[11px] leading-snug text-foreground">
          <Linhas linhas={e.linhas ?? []} />
        </div>
        <div className="mt-2 flex gap-3 border-t border-border pt-1.5 text-[10px] text-muted-foreground">
          <span>👍 34 curtidas</span>
          <span>💬 12 comentários</span>
          <span>↗ compartilhar</span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ cartaz ------------------------------ */

function Cartaz({ e }: { e: Exemplo }) {
  return (
    <div className="rounded-lg border-4 border-dashed border-amber-500 bg-gradient-to-b from-amber-50 to-orange-100 p-4 text-center text-[#5b3210] shadow-sm">
      <p className="text-lg font-extrabold uppercase leading-tight tracking-tight">{e.titulo}</p>
      <div className="mt-2 space-y-0.5 text-[12px] font-semibold">
        <Linhas linhas={e.linhas ?? []} />
      </div>
    </div>
  );
}

/* ------------------------------ e-mail ------------------------------ */

function Email({ e }: { e: Exemplo }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="space-y-0.5 border-b border-border bg-muted/50 px-3 py-1.5">
        {(e.campos ?? []).map((c) => (
          <p key={c.rotulo} className="text-[10px]">
            <span className="inline-block w-12 text-muted-foreground">{c.rotulo}:</span>
            <span className={c.rotulo === "Assunto" ? "font-semibold text-foreground" : ""}>
              {c.valor}
            </span>
          </p>
        ))}
      </div>
      <div className="space-y-0.5 p-3 text-[11px] leading-snug text-foreground">
        <Linhas linhas={e.linhas ?? []} />
      </div>
    </div>
  );
}

/* ----------------------------- tirinha ------------------------------ */

function Tirinha({ e }: { e: Exemplo }) {
  const quadros = e.quadros ?? [];
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {quadros.map((q, i) => (
        <div
          key={i}
          className="flex flex-col justify-between rounded border-2 border-[#1c1c1a] bg-[#fffdf5] p-1.5"
        >
          <div className="rounded-lg border border-[#1c1c1a] bg-white px-1.5 py-1 text-[9.5px] leading-tight text-[#1c1c1a]">
            {q.fala}
          </div>
          <svg
            viewBox="0 0 60 40"
            className="mx-auto mt-1 h-10 w-full"
            role="img"
            aria-label={q.cena}
          >
            <circle cx={30} cy={14} r={9} fill="#f5c16c" stroke="#8a5a1d" strokeWidth={1.2} />
            <circle cx={27} cy={12} r={1.2} fill="#1c1c1a" />
            <circle cx={33} cy={12} r={1.2} fill="#1c1c1a" />
            <path
              d={i === quadros.length - 1 ? "M26 17 q4 4 8 0" : "M26 18 h8"}
              stroke="#1c1c1a"
              strokeWidth={1.2}
              fill="none"
              strokeLinecap="round"
            />
            <path d="M30 23 q-9 2 -9 14 h18 q0-12 -9-14 z" fill="#0ea5e9" />
          </svg>
          <p className="mt-0.5 text-center text-[8px] italic text-[#6b6a63]">{q.cena}</p>
        </div>
      ))}
    </div>
  );
}

/* ---------------------- receita / manual / regras -------------------- */

function Receita({ e }: { e: Exemplo }) {
  return (
    <div className="rounded-lg border border-border bg-[#fffdf7] p-3 text-[#2a2a28] shadow-sm">
      <p className="border-b-2 border-dotted border-[#c08a3e] pb-1 font-serif text-sm font-bold">
        {e.titulo}
      </p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {(e.secoes ?? []).map((s) => {
          const numerada = /modo|montagem|como/i.test(s.titulo);
          return (
            <div key={s.titulo}>
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#a06a1f]">
                {s.titulo}
              </p>
              {numerada ? (
                <ol className="mt-0.5 space-y-0.5 text-[10.5px] leading-snug">
                  {s.linhas.map((l, i) => (
                    <li key={l} className="flex gap-1.5">
                      <span className="font-bold text-[#a06a1f]">{i + 1}.</span>
                      <span>{l}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <ul className="mt-0.5 space-y-0.5 text-[10.5px] leading-snug">
                  {s.linhas.map((l) => (
                    <li key={l} className="flex gap-1.5">
                      <span className="text-[#a06a1f]">•</span>
                      <span>{l}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------- placa ------------------------------ */

function Placa({ e }: { e: Exemplo }) {
  return (
    <div className="flex flex-col items-center gap-2 py-2">
      <svg viewBox="0 0 160 150" className="h-[150px]" role="img" aria-label="Placa de trânsito">
        <path d="M80 6 L150 76 L80 146 L10 76 Z" fill="#f5c518" stroke="#1c1c1a" strokeWidth={5} />
        <circle cx={66} cy={62} r={7} fill="#1c1c1a" />
        <path
          d="M66 69 q-7 3 -7 14 l4 12 M66 69 q7 3 7 14 l-4 12"
          stroke="#1c1c1a"
          strokeWidth={4}
          fill="none"
          strokeLinecap="round"
        />
        <circle cx={96} cy={66} r={6} fill="#1c1c1a" />
        <path
          d="M96 72 q-6 3 -6 12 l3 10 M96 72 q6 3 6 12 l-3 10"
          stroke="#1c1c1a"
          strokeWidth={3.5}
          fill="none"
          strokeLinecap="round"
        />
        <text x={80} y={116} textAnchor="middle" className="text-[15px] font-bold" fill="#1c1c1a">
          {e.titulo}
        </text>
      </svg>
      <div className="rounded border-2 border-[#1c1c1a] bg-white px-3 py-1 text-center">
        {(e.linhas ?? []).map((l) => (
          <p key={l} className="text-[11px] font-bold uppercase text-[#1c1c1a]">
            {l}
          </p>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------- */

export function MolduraExemplo({ exemplo }: { exemplo: Exemplo }) {
  switch (exemplo.formato) {
    case "celular":
      return <Celular e={exemplo} />;
    case "rotulo":
      return <Rotulo e={exemplo} />;
    case "bula":
      return <Bula e={exemplo} />;
    case "jornal":
      return <Jornal e={exemplo} />;
    case "blog":
      return <Blog e={exemplo} />;
    case "cartaz":
      return <Cartaz e={exemplo} />;
    case "email":
      return <Email e={exemplo} />;
    case "tirinha":
      return <Tirinha e={exemplo} />;
    case "receita":
      return <Receita e={exemplo} />;
    case "placa":
      return <Placa e={exemplo} />;
    default:
      return <Papel e={exemplo} />;
  }
}
