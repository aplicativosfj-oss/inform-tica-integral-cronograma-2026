import { Link } from "@tanstack/react-router";
import {
  CalendarClock,
  GraduationCap,
  Loader2,
  Settings2,
  ShieldAlert,
  Users2,
} from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-store";
import restritoBgImg from "@/assets/image8.png";

const RECURSOS = [
  { icon: Users2, label: "Turmas e alunos" },
  { icon: CalendarClock, label: "Programação e aulas" },
  { icon: GraduationCap, label: "Frequência e faltas" },
  { icon: Settings2, label: "Configurações" },
];

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
      <div className="relative min-h-[calc(100vh-3.5rem)] overflow-hidden">
        {/* Mesma ambientação de tecnologia do login, para quem cai aqui sem
            estar logado sentir que está no mesmo lugar, não numa tela de
            erro genérica. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 bg-cover bg-center opacity-[0.16]"
          style={{ backgroundImage: `url(${restritoBgImg})` }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-background/60 via-background/85 to-background"
        />
        <div className="relative z-10 mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-md flex-col items-center justify-center gap-6 px-4 py-10 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <ShieldAlert className="size-7" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Painel de gestão</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Esta área é de uso exclusivo do professor responsável e da coordenação. Faça login com
              a conta de gestão para continuar.
            </p>
          </div>

          <Card className="w-full backdrop-blur-sm">
            <CardContent className="grid grid-cols-2 gap-3 py-5">
              {RECURSOS.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-left">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-4" />
                  </span>
                  <span className="text-xs font-medium text-foreground">{label}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Button asChild size="lg" className="w-full">
            <Link to="/login">Ir para o login</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
