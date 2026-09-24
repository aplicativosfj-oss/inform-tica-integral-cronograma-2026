import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AppProvider } from "../lib/app-store";
import { AuthProvider } from "../lib/auth-store";
import { ConfirmProvider } from "../lib/confirm-store";
import { JovemPanRadioProvider } from "../lib/jovem-pan-radio-store";
import { ThemeProvider } from "../lib/theme-store";
import { Toaster } from "../components/ui/sonner";
import { AlunoSessaoGuard } from "../components/school/aluno-sessao-guard";
import { AvisoAulaEmBreve } from "../components/school/aviso-aula-em-breve";
import { usePWAInstallInitializer } from "../lib/use-pwa-install";
import { FONTES_CSS, precarregarOffline } from "../lib/offline-precache";
import { useCarregarHistoricoParticipacao } from "../lib/use-historico-participacao";

/**
 * Aplica o tema salvo (ou o do sistema) antes da primeira pintura, para
 * nunca piscar claro->escuro ao carregar a página.
 */
const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('informatica:theme');if(t!=='light')document.documentElement.classList.add('dark');}catch(e){}})();`;

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: ({ matches }) => {
    // A página /sala-de-jogos é instalada como um app à parte, com ícone e
    // nome próprios: só ela troca o manifesto e o ícone do site.
    const appJogos = matches.some((m) => (m.routeId as string) === "/sala-de-jogos");
    return {
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Agenda de Informática · Dr. Eiraldo Carneiro de França" },
      {
        name: "description",
        content:
          "Agenda profissional das aulas de informática: turmas, horários, revezamento e cronômetro ao vivo.",
      },
      { name: "author", content: "Escola Dr. Eiraldo Carneiro de França" },
      { name: "robots", content: "index, follow" },
      { property: "og:title", content: "Agenda de Informática" },
      {
        property: "og:description",
        content: "Cronograma das aulas de informática por turma, dia e horário.",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Agenda de Informática · Escola Dr. Eiraldo Carneiro" },
      { property: "og:locale", content: "pt_BR" },
      // Imagem quadrada + twitter:card "summary" = card compacto, com a
      // miniatura ao lado do texto. Com a arte 1200x630 e "summary_large_image"
      // o link virava um banner ocupando a conversa inteira.
      //
      // O ?v= força Facebook/WhatsApp/LinkedIn a rebaixar o card em cache;
      // sem ele, a arte antiga continua aparecendo por semanas nos
      // compartilhamentos. Suba o número sempre que a arte mudar.
      { property: "og:image", content: "/og-thumb.jpg?v=9" },
      { property: "og:image:type", content: "image/jpeg" },
      { property: "og:image:width", content: "600" },
      { property: "og:image:height", content: "600" },
      {
        property: "og:image:alt",
        content: "Agenda de Informática · Escola Dr. Eiraldo Carneiro",
      },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Agenda de Informática" },
      {
        name: "twitter:description",
        content: "Cronograma das aulas de informática por turma, dia e horário.",
      },
      { name: "twitter:image", content: "/og-thumb.jpg?v=9" },
      {
        name: "twitter:image:alt",
        content: "Agenda de Informática · Escola Dr. Eiraldo Carneiro",
      },
      { name: "theme-color", content: appJogos ? "#047857" : "#1e3a8a" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      {
        name: "apple-mobile-web-app-title",
        content: appJogos ? "Sala de Jogos" : "Agenda Informática",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "manifest",
        href: appJogos ? "/manifest-jogos.webmanifest" : "/manifest.webmanifest",
      },
      // Resource hints for performance optimization
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      // Sora (títulos) + Nunito Sans (corpo) — mesma dupla já usada no
      // observatório de Avaliações (src/lib/observatorio-template.html),
      // aqui carregada pro site inteiro falar a mesma tipografia.
      {
        rel: "stylesheet",
        href: FONTES_CSS,
      },
      { rel: "dns-prefetch", href: "https://cdn.example.com" },
      // Prefetch next likely routes
      { rel: "prefetch", href: "/agenda", as: "fetch" },
      { rel: "prefetch", href: "/dashboard", as: "fetch" },
      // Favicon profissional com gradiente
      { rel: "icon", href: "/favicon.svg?v=4", type: "image/svg+xml" },
      { rel: "icon", href: "/favicon-32.png?v=4", type: "image/png", sizes: "32x32" },
      { rel: "icon", href: "/favicon-16.png?v=4", type: "image/png", sizes: "16x16" },
      {
        rel: "apple-touch-icon",
        href: appJogos ? "/icons/jogos-apple-touch.png" : "/icons/apple-touch-icon.png?v=4",
      },
    ],
    };
  },
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  usePWAInstallInitializer();
  useCarregarHistoricoParticipacao();

  useEffect(() => {
    // Em dev, o middleware SSR intercepta /sw.js e devolve HTML em vez do
    // script, então o registro sempre falha — sem ganho nenhum localmente.
    if (import.meta.env.DEV) return;
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js")
      .then(() => precarregarOffline())
      .catch((err) => {
        console.error("Falha ao registrar o service worker:", err);
      });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <AppProvider>
            <ConfirmProvider>
              <JovemPanRadioProvider>
                {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
                <Outlet />
                <Toaster />
                <AvisoAulaEmBreve />
                <AlunoSessaoGuard />
              </JovemPanRadioProvider>
            </ConfirmProvider>
          </AppProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
