import { Link } from "@tanstack/react-router";
import { Code2, Mail, MapPin } from "lucide-react";

const ANO_ATUAL = new Date().getFullYear();

/**
 * Rodapé institucional: assinatura do desenvolvedor, cidade/ano e um atalho
 * para a página "Sobre" (que também concentra o contato). Compartilhado por
 * todas as páginas públicas para manter a mesma identidade em todo o site.
 */
export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 py-6 text-center sm:px-6">
        <p className="flex flex-wrap items-center justify-center gap-1.5 text-sm text-muted-foreground">
          <Code2 className="size-4 text-primary" />
          Desenvolvido por <span className="font-medium text-foreground">Franc D&apos;nis</span>
        </p>
        <p className="flex flex-wrap items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="size-3.5" /> Feijó, Acre · {ANO_ATUAL}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs">
          <Link to="/sobre" className="text-primary underline-offset-4 hover:underline">
            Sobre a plataforma
          </Link>
          <a
            href="mailto:aplicativosfj@gmail.com"
            className="flex items-center gap-1 text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            <Mail className="size-3.5" /> aplicativosfj@gmail.com
          </a>
        </div>
      </div>
    </footer>
  );
}
