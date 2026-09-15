import { Link } from "@tanstack/react-router";
import { Loader2, ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-store";

export function Protected({ children }: { children: ReactNode }) {
  const { isReady, isAuthenticated } = useAuth();

  if (!isReady) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShieldAlert className="size-6" />
        </span>
        <div>
          <h1 className="text-lg font-semibold text-foreground">Acesso restrito</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Faça login com a conta de gestão para acessar o painel administrativo.
          </p>
        </div>
        <Button asChild>
          <Link to="/login">Ir para o login</Link>
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
