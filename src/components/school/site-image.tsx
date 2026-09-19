import { ImageOff, ShieldAlert } from "lucide-react";
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
  srcLarga,
  alt,
  legenda,
  className,
  ...props
}: {
  src: string;
  /**
   * Versão para telas largas (>=1024px). Existe para direção de arte: em
   * celular um recorte alto lê bem, em desktop um banner panorâmico. Sem ela,
   * `src` serve as duas — e só um dos arquivos é baixado, nunca os dois.
   */
  srcLarga?: string;
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
        className={cn("group/img cursor-pointer relative block", className)}
        aria-label={`Ampliar imagem: ${alt}`}
      >
        <picture>
          {srcLarga ? <source media="(min-width: 1024px)" srcSet={srcLarga} /> : null}
          <img
            src={src}
            alt={alt}
            draggable={false}
            onContextMenu={bloquearContextoEArraste}
            onDragStart={bloquearContextoEArraste}
            style={ANTI_COPIA_STYLE}
            className="size-full object-cover transition-[filter] duration-200 group-hover/img:brightness-95"
            {...props}
          />
        </picture>
      </button>

      <Dialog open={aberta} onOpenChange={setAberta}>
        <DialogContent className="max-w-3xl gap-0 overflow-hidden p-0 sm:rounded-2xl">
          <DialogTitle className="sr-only">{descricao}</DialogTitle>
          <picture>
            {srcLarga ? <source media="(min-width: 1024px)" srcSet={srcLarga} /> : null}
            <img
              src={src}
              alt={alt}
              draggable={false}
              onContextMenu={bloquearContextoEArraste}
              onDragStart={bloquearContextoEArraste}
              style={ANTI_COPIA_STYLE}
              className="max-h-[70vh] w-full bg-black object-contain"
            />
          </picture>
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
