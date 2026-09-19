import { ImageOff, ShieldAlert, ZoomIn } from "lucide-react";
import { useState, type CSSProperties, type ImgHTMLAttributes } from "react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/** Bloqueia os atalhos mais comuns de "salvar imagem" sem fingir ser à prova de tudo. */
const ANTI_COPIA_STYLE: CSSProperties = {
  userSelect: "none",
  WebkitUserSelect: "none",
  WebkitTouchCallout: "none",
};

function bloquearContextoEArraste(e: { preventDefault: () => void }) {
  e.preventDefault();
}

const AVISO_DIREITOS =
  "Imagem ilustrativa e real, de uso exclusivo desta plataforma. Reprodução, cópia ou uso sem autorização não são permitidos.";

/**
 * Foto de conteúdo do site (não um avatar de turma/aluno): protegida contra
 * cópia casual (clique direito, arrastar) e clicável para abrir um
 * visualizador maior, com legenda e o aviso de direitos autorais. Nenhuma
 * proteção client-side impede um usuário determinado (DevTools, captura de
 * tela) — isso é um desestímulo, não uma trava técnica real.
 */
export function SiteImage({
  src,
  alt,
  legenda,
  className,
  ...props
}: {
  src: string;
  alt: string;
  /** Explicação maior, mostrada no visualizador ampliado. Usa `alt` se omitida. */
  legenda?: string;
} & Omit<ImgHTMLAttributes<HTMLImageElement>, "onContextMenu" | "onDragStart" | "draggable">) {
  const [aberta, setAberta] = useState(false);
  const descricao = legenda ?? alt;

  return (
    <>
      <button
        type="button"
        onClick={() => setAberta(true)}
        className={cn("group/img relative block cursor-zoom-in", className)}
        aria-label={`Ampliar imagem: ${alt}`}
      >
        <img
          src={src}
          alt={alt}
          draggable={false}
          onContextMenu={bloquearContextoEArraste}
          onDragStart={bloquearContextoEArraste}
          style={ANTI_COPIA_STYLE}
          className="size-full object-cover"
          {...props}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-[background-color,opacity] duration-200 group-hover/img:bg-black/30 group-hover/img:opacity-100"
        >
          <ZoomIn className="size-6 text-white drop-shadow" />
        </span>
      </button>

      <Dialog open={aberta} onOpenChange={setAberta}>
        <DialogContent className="max-w-3xl gap-0 overflow-hidden p-0 sm:rounded-2xl">
          <DialogTitle className="sr-only">{descricao}</DialogTitle>
          <img
            src={src}
            alt={alt}
            draggable={false}
            onContextMenu={bloquearContextoEArraste}
            onDragStart={bloquearContextoEArraste}
            style={ANTI_COPIA_STYLE}
            className="max-h-[70vh] w-full bg-black object-contain"
          />
          <div className="flex flex-col gap-2 p-4">
            <p className="text-sm font-medium text-foreground">{descricao}</p>
            <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <ShieldAlert className="mt-0.5 size-3.5 shrink-0" />
              {AVISO_DIREITOS}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Selo curto para colocar sob uma foto ou galeria, fora do visualizador. */
export function AvisoDireitosImagem({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground",
        className,
      )}
    >
      <ImageOff className="size-3" aria-hidden />
      Imagens ilustrativas e reais — reprodução e cópia não autorizadas.
    </p>
  );
}
