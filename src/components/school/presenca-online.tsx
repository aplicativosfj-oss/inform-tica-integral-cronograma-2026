import { Users } from "lucide-react";
import { useEffect, useState } from "react";

import { lerAlunoSessao } from "@/lib/aluno-session";
import { useAuth } from "@/lib/auth-store";
import { supabase } from "@/lib/supabase-client";
import { cn } from "@/lib/utils";

const CHAVE_NAVEGADOR = "informatica:navegador-id";

/**
 * Identifica o navegador (não a aba): o id fica no localStorage, que todas as
 * abas do mesmo navegador compartilham. Como a presença do Supabase agrupa
 * por essa chave, vinte abas abertas no mesmo navegador contam como uma
 * pessoa só.
 */
function idDoNavegador(): string {
  try {
    const salvo = window.localStorage.getItem(CHAVE_NAVEGADOR);
    if (salvo) return salvo;
    const novo = crypto.randomUUID();
    window.localStorage.setItem(CHAVE_NAVEGADOR, novo);
    return novo;
  } catch {
    return crypto.randomUUID();
  }
}

/** Quantas pessoas (navegadores) estão com o site aberto agora, e quantas logadas. */
export function PresencaOnline() {
  const { isAuthenticated } = useAuth();
  const [online, setOnline] = useState<number | null>(null);
  const [logados, setLogados] = useState(0);

  useEffect(() => {
    const canal = supabase.channel("online-agenda", {
      config: { presence: { key: idDoNavegador() } },
    });
    const ler = () => {
      const estado = canal.presenceState<{ logado?: boolean }>();
      const chaves = Object.keys(estado);
      setOnline(chaves.length);
      setLogados(chaves.filter((k) => estado[k]?.some((m) => m.logado)).length);
    };
    canal.on("presence", { event: "sync" }, ler).subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await canal.track({ logado: isAuthenticated || Boolean(lerAlunoSessao()) });
      }
    });
    return () => {
      void supabase.removeChannel(canal);
    };
  }, [isAuthenticated]);

  if (online === null) return null;

  const rotulo = `${online} ${online === 1 ? "pessoa online" : "pessoas online"}, ${logados} ${
    logados === 1 ? "logada" : "logadas"
  }`;

  return (
    <span
      tabIndex={0}
      role="status"
      aria-label={rotulo}
      className="group relative flex shrink-0 cursor-default items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 dark:text-emerald-300"
    >
      <span className="relative flex size-2" aria-hidden>
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-70" />
        <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
      </span>
      <Users className="size-3.5" aria-hidden />
      <span aria-hidden>{online}</span>
      <span aria-hidden className="hidden lg:inline">
        online
      </span>

      {/* Legenda própria (no lugar do texto amarelo do navegador). */}
      <span
        role="tooltip"
        className="pointer-events-none absolute right-0 top-full z-50 mt-2 w-64 translate-y-1 rounded-xl border border-border/70 bg-card p-3 text-left font-normal text-card-foreground opacity-0 shadow-xl shadow-black/10 transition duration-150 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100"
      >
        <span className="flex items-center gap-2.5">
          <svg viewBox="0 0 40 40" className="size-9 shrink-0" aria-hidden>
            <defs>
              <linearGradient id="presenca-fundo" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#34d399" />
                <stop offset="1" stopColor="#0d9488" />
              </linearGradient>
            </defs>
            <rect width="40" height="40" rx="11" fill="url(#presenca-fundo)" />
            <circle cx="15" cy="16" r="4.2" fill="#fff" />
            <path d="M7.5 29c0-4.2 3.4-7 7.5-7s7.5 2.8 7.5 7" fill="#fff" />
            <circle cx="27" cy="17.5" r="3.4" fill="#fff" fillOpacity=".7" />
            <path
              d="M23.5 29c.2-3.3 2.4-5.4 5.3-5.4 2.6 0 4.7 1.7 4.7 5.4"
              fill="#fff"
              fillOpacity=".7"
            />
          </svg>
          <span className="block leading-tight">
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Agora no site
            </span>
            <span className="block text-sm font-bold text-foreground">
              {online} {online === 1 ? "pessoa online" : "pessoas online"}
            </span>
          </span>
        </span>
        <span className="mt-2.5 flex items-center justify-between border-t border-border/60 pt-2 text-xs text-muted-foreground">
          <span>Com login</span>
          <span className="font-semibold text-foreground">{logados}</span>
        </span>
        <span className="mt-1.5 block text-[11px] leading-snug text-muted-foreground">
          Cada navegador conta uma vez, mesmo com várias abas abertas.
        </span>
      </span>
    </span>
  );
}
