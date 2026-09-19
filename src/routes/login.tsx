import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LockKeyhole, LogIn, MonitorSmartphone } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NavBar } from "@/components/school/nav-bar";
import { useAuth } from "@/lib/auth-store";
import loginBgImg from "@/assets/image8.png";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "Entrar · Agenda de Informática" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) navigate({ to: "/dashboard" });
  }, [isAuthenticated, navigate]);

  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    const errorMessage = await login(email, password);
    setSubmitting(false);
    if (!errorMessage) {
      toast.success("Login realizado com sucesso.");
      navigate({ to: "/dashboard" });
    } else {
      setError(
        errorMessage.toLowerCase().includes("confirm")
          ? "Confirme seu e-mail antes de entrar (verifique sua caixa de entrada)."
          : "E-mail ou senha inválidos.",
      );
    }
  }

  return (
    <div className="relative min-h-screen bg-background">
      {/* Imagem de fundo ambientada em tecnologia, com overlay para manter contraste do card de login.
          O véu é bem mais leve no escuro: o fundo já é escuro por natureza, então
          um degradê forte por cima apagava a foto quase por completo. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center opacity-[0.16] dark:opacity-30"
        style={{ backgroundImage: `url(${loginBgImg})` }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 bg-gradient-to-b from-background/60 via-background/85 to-background dark:from-background/30 dark:via-background/60 dark:to-background"
      />
      <div className="relative z-10">
        <NavBar />
        <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-4 py-8">
          <Card className="w-full backdrop-blur-sm">
            <CardHeader className="items-center text-center">
              <span className="mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <MonitorSmartphone className="size-6" />
              </span>
              <CardTitle>Painel de gestão</CardTitle>
              <CardDescription>
                Acesso exclusivo do professor responsável pela sala de informática.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="username"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seuemail@exemplo.com"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                {error ? <p className="text-sm text-destructive">{error}</p> : null}
                <Button type="submit" className="mt-2" disabled={submitting}>
                  <LogIn /> {submitting ? "Entrando..." : "Entrar"}
                </Button>
                <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                  <LockKeyhole className="size-3.5" /> Acesso restrito à gestão da escola
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
