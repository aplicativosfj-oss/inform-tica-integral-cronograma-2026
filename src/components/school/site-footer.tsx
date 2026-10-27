import { Link } from "@tanstack/react-router";
import { Mail, MapPin } from "lucide-react";

import { Marca } from "@/components/school/marca";

const ANO_ATUAL = new Date().getFullYear();

const LINKS = [
  { to: "/", rotulo: "Início" },
  { to: "/agenda", rotulo: "Laboratório" },
  { to: "/resultados", rotulo: "Resultados" },
  { to: "/avaliacao", rotulo: "Avaliações" },
  { to: "/infoteca", rotulo: "Infoteca" },
  { to: "/sobre", rotulo: "Sobre" },
] as const;

/**
 * Rodapé institucional: marca, atalhos principais, contato e assinatura do
 * desenvolvedor. Compartilhado por todas as páginas públicas.
 */
export function SiteFooter() {
  return (
    <footer className="relative border-t border-border bg-ink text-white dark:bg-card">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-sun to-mint"
      />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.3fr_1fr_1fr]">
        <div className="space-y-3">
          <Marca className="[&_span]:!text-white [&_span.text-sun]:!text-sun" />
          <p className="max-w-xs text-sm text-white/65">
            O laboratório de informática da Escola Municipal em Tempo Integral Dr. Eiraldo Carneiro
            de França.
          </p>
        </div>

        <nav aria-label="Atalhos do rodapé">
          <h2 className="font-heading text-sm font-bold uppercase tracking-[0.16em] text-sun">
            Navegue
          </h2>
          <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-white/75">
            {LINKS.map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className="underline-offset-4 transition-colors hover:text-white hover:underline"
                >
                  {l.rotulo}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="font-heading text-sm font-bold uppercase tracking-[0.16em] text-sun">
            Contato
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-white/75">
            <li className="flex items-center gap-2">
              <MapPin className="size-4 shrink-0" aria-hidden /> Feijó, Acre
            </li>
            <li>
              <a
                href="mailto:aplicativosfj@gmail.com"
                className="flex items-center gap-2 underline-offset-4 hover:text-white hover:underline"
              >
                <Mail className="size-4 shrink-0" aria-hidden /> aplicativosfj@gmail.com
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-xs text-white/55 sm:px-6">
          <span>© {ANO_ATUAL} Escola Dr. Eiraldo Carneiro de França</span>
          <span>
            Desenvolvido por <span className="font-semibold text-white/80">Franc D&apos;nis</span>
          </span>
        </p>
      </div>
    </footer>
  );
}
