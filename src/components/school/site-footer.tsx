import { Link } from "@tanstack/react-router";
import { Code2, Mail, MapPin } from "lucide-react";

const ANO_ATUAL = new Date().getFullYear();

/**
 * Rodapé institucional: assinatura do desenvolvedor, cidade/ano e um atalho
 * para a página "Sobre" (que também concentra o contato). Compartilhado por
 * todas as páginas públicas para manter a mesma identidade em todo o site.
 *
 * Uma linha só no desktop (justify-between), baixa e sem sobra — o pedido
 * foi "compacto e baixo", então em vez de empilhar em três linhas centradas,
 * o conteúdo se espalha lado a lado e só quebra em duas linhas no celular.
 */
export function SiteFooter() {
  return (
    <footer className="relative border-t border-border/60 bg-background">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
      />
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-6 gap-y-1.5 px-4 py-3.5 text-center text-xs text-muted-foreground sm:justify-between sm:text-left sm:px-6">
        <p className="flex items-center gap-1.5">
          <Code2 className="size-3.5 text-primary" />
          Desenvolvido por <span className="font-semibold text-foreground">Franc D&apos;nis</span>
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
          <span className="flex items-center gap-1">
            <MapPin className="size-3.5" /> Feijó, Acre · {ANO_ATUAL}
          </span>
          <Link to="/sobre" className="text-primary underline-offset-4 hover:underline">
            Sobre a plataforma
          </Link>
          <a
            href="mailto:aplicativosfj@gmail.com"
            className="flex items-center gap-1 underline-offset-4 hover:text-foreground hover:underline"
          >
            <Mail className="size-3.5" /> aplicativosfj@gmail.com
          </a>
        </div>
      </div>
    </footer>
  );
}
