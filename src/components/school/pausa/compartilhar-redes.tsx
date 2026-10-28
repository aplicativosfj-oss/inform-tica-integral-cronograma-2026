import { Check, Facebook, Link2, MessageCircle, Send, Share2, Twitter } from "lucide-react";
import { useState } from "react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/**
 * Botão discreto de compartilhar: abre um pequeno menu com WhatsApp,
 * Facebook, X, Telegram e "copiar link". No celular, também oferece o menu
 * de compartilhamento do próprio aparelho.
 */
export function CompartilharRedes({
  caminho,
  texto,
  className,
}: {
  caminho: string;
  texto: string;
  className?: string;
}) {
  const [copiado, setCopiado] = useState(false);
  const url = () => `${window.location.origin}${caminho}`;
  const abrir = (endereco: string) => window.open(endereco, "_blank", "noopener,noreferrer");
  const e = encodeURIComponent;

  const redes = [
    {
      nome: "WhatsApp",
      Icone: MessageCircle,
      cor: "text-emerald-500",
      ir: () => abrir(`https://wa.me/?text=${e(`${texto} ${url()}`)}`),
    },
    {
      nome: "Facebook",
      Icone: Facebook,
      cor: "text-blue-600",
      ir: () => abrir(`https://www.facebook.com/sharer/sharer.php?u=${e(url())}`),
    },
    {
      nome: "X (Twitter)",
      Icone: Twitter,
      cor: "text-foreground",
      ir: () => abrir(`https://twitter.com/intent/tweet?text=${e(texto)}&url=${e(url())}`),
    },
    {
      nome: "Telegram",
      Icone: Send,
      cor: "text-sky-500",
      ir: () => abrir(`https://t.me/share/url?url=${e(url())}&text=${e(texto)}`),
    },
  ];

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(url());
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2200);
    } catch {
      // O navegador negou a cópia: nada a fazer.
    }
  };

  const nativo = typeof navigator !== "undefined" && typeof navigator.share === "function";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Compartilhar esta página"
          className={cn(
            "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-colors",
            className,
          )}
        >
          <Share2 className="size-4" aria-hidden /> Compartilhar
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 rounded-xl p-1.5">
        <p className="px-2.5 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Compartilhar
        </p>
        {redes.map(({ nome, Icone, cor, ir }) => (
          <button
            key={nome}
            type="button"
            onClick={ir}
            className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium hover:bg-muted"
          >
            <Icone className={cn("size-4", cor)} aria-hidden /> {nome}
          </button>
        ))}
        <button
          type="button"
          onClick={() => void copiar()}
          className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium hover:bg-muted"
        >
          {copiado ? (
            <Check className="size-4 text-emerald-500" aria-hidden />
          ) : (
            <Link2 className="size-4 text-muted-foreground" aria-hidden />
          )}
          {copiado ? "Link copiado!" : "Copiar link"}
        </button>
        {nativo ? (
          <button
            type="button"
            onClick={() =>
              void navigator.share({ title: texto, text: texto, url: url() }).catch(() => {})
            }
            className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium hover:bg-muted"
          >
            <Share2 className="size-4 text-muted-foreground" aria-hidden /> Mais opções…
          </button>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
