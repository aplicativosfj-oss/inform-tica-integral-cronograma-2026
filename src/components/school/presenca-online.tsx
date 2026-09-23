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

  return (
    <span
      title={`${online} ${online === 1 ? "pessoa" : "pessoas"} com o site aberto agora (${logados} logada${logados === 1 ? "" : "s"}). Várias abas do mesmo navegador contam como uma pessoa só.`}
      className="flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300"
    >
      <span className="relative flex size-2">
        <span
          className={cn(
            "absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-70",
          )}
        />
        <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
      </span>
      <Users className="size-3.5" aria-hidden />
      {online}
      <span className="sr-only">
        {online === 1 ? "pessoa online" : "pessoas online"}, {logados} logada
        {logados === 1 ? "" : "s"}
      </span>
      <span aria-hidden className="hidden lg:inline">
        online
      </span>
    </span>
  );
}
