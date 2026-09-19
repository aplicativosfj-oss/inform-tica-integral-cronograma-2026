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

/**
 * Aplica o tema salvo (ou o do sistema) antes da primeira pintura, para
 * nunca piscar claro->escuro ao carregar a página.
 */
const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('informatica:theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`;

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
  head: () => ({
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
      { property: "og:image", content: "/logo-full.svg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      {
        property: "og:image:alt",
        content: "Agenda de Informática - Cronograma automático de aulas",
      },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Agenda de Informática" },
      {
        name: "twitter:description",
        content: "Cronograma automático de aulas com revezamento justo entre alunos.",
      },
      { name: "twitter:image", content: "/logo-full.svg" },
      { name: "theme-color", content: "#1e3a8a" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "Agenda Informática" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "manifest", href: "/manifest.json" },
      // Resource hints for performance optimization
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "dns-prefetch", href: "https://cdn.example.com" },
      // Prefetch next likely routes
      { rel: "prefetch", href: "/agenda", as: "fetch" },
      { rel: "prefetch", href: "/dashboard", as: "fetch" },
      // Favicon profissional com gradiente
      { rel: "icon", href: "/favicon.svg?v=4", type: "image/svg+xml" },
      { rel: "icon", href: "/favicon-32.png?v=4", type: "image/png", sizes: "32x32" },
      { rel: "icon", href: "/favicon-16.png?v=4", type: "image/png", sizes: "16x16" },
      { rel: "apple-touch-icon", href: "/icons/apple-touch-icon.png?v=4" },
    ],
  }),
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

  useEffect(() => {
    // Em dev, o middleware SSR intercepta /sw.js e devolve HTML em vez do
    // script, então o registro sempre falha — sem ganho nenhum localmente.
    if (import.meta.env.DEV) return;
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch((err) => {
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
              </JovemPanRadioProvider>
            </ConfirmProvider>
          </AppProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
