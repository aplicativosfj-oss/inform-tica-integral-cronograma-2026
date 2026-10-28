import { Link } from "@tanstack/react-router";
import { Mail, MapPin } from "lucide-react";

import { Marca } from "@/components/school/marca";
import { useAppStore } from "@/lib/app-store";

const ANO_ATUAL = new Date().getFullYear();

const LINKS = [
  { to: "/", rotulo: "Início" },
  { to: "/agenda", rotulo: "Laboratório" },
  { to: "/resultados", rotulo: "Resultados" },
  { to: "/avaliacao", rotulo: "Avaliações" },
  { to: "/infoteca", rotulo: "Infoteca" },
  { to: "/mapa-da-pausa", rotulo: "Mapa da Pausa" },
  { to: "/sobre", rotulo: "Sobre" },
] as const;

/**
 * Rodapé compacto: marca, atalhos e contato numa linha só (empilha no
 * celular), e uma fita fina embaixo com escola, INEP, endereço e assinatura.
 */
export function SiteFooter() {
  const { config } = useAppStore();
  return (
    <footer className="relative bg-ink text-white dark:bg-card">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary via-sun to-mint"
      />
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-8 gap-y-3 px-4 py-4 sm:px-6">
        <Link to="/" aria-label="Início" className="shrink-0">
          <Marca curto className="[&_span]:!text-white [&_span.text-sun]:!text-sun" />
        </Link>

        <nav aria-label="Atalhos do rodapé">
          <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/75">
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

        <a
          href="mailto:aplicativosfj@gmail.com"
          className="flex items-center gap-1.5 text-sm text-white/75 underline-offset-4 hover:text-white hover:underline"
        >
          <Mail className="size-4 shrink-0" aria-hidden /> aplicativosfj@gmail.com
        </a>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-2 text-[11px] text-white/55 sm:px-6">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span>
              © {ANO_ATUAL} {config.nomeEscola}
            </span>
            <span aria-hidden className="hidden sm:inline">
              ·
            </span>
            <span>INEP {config.inep}</span>
            <span aria-hidden className="hidden sm:inline">
              ·
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="size-3 shrink-0" aria-hidden /> {config.endereco}
            </span>
          </p>
          <p>
            Feito com carinho por{" "}
            <span className="font-semibold text-white/80">Franc D&apos;nis</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
