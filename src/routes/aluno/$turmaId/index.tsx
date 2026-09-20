import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, KeyRound, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NavBar } from "@/components/school/nav-bar";
import { PageBackground } from "@/components/school/page-background";
import { SiteFooter } from "@/components/school/site-footer";
import { useAppStore } from "@/lib/app-store";
import { iniciarAlunoSessao } from "@/lib/aluno-session";
import { registrarAcesso, verificarPin } from "@/lib/aluno-area";
import { serieClasses, serieIndexPorNumero } from "@/lib/serie-colors";
import type { Aluno } from "@/lib/types";

export const Route = createFileRoute("/aluno/$turmaId/")({
  component: AlunoPicker,
  head: () => ({
    meta: [
      { title: "Área do Aluno · Agenda de Informática" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function AlunoPicker() {
  const { turmaId } = Route.useParams();
  const { turmas } = useAppStore();
  const navigate = useNavigate();
  const turma = turmas.find((t) => t.id === turmaId);
  const [alunoSelecionado, setAlunoSelecionado] = useState<Aluno | null>(null);
  const [pin, setPin] = useState("");
  const [verificando, setVerificando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function confirmarPin() {
    if (!alunoSelecionado) return;
    setVerificando(true);
    setErro(null);
    try {
      const ok = await verificarPin(alunoSelecionado.id, pin);
      if (!ok) {
        setErro("PIN incorreto. Peça o código de acesso ao professor(a).");
        return;
      }
      await registrarAcesso(alunoSelecionado.id, turmaId, pin);
      iniciarAlunoSessao({
        alunoId: alunoSelecionado.id,
        turmaId,
        nome: alunoSelecionado.nome,
        pin,
      });
      navigate({
        to: "/aluno/$turmaId/$alunoId",
        params: { turmaId, alunoId: alunoSelecionado.id },
      });
    } catch (err) {
      toast.error(`Não foi possível entrar: ${(err as Error).message}`);
    } finally {
      setVerificando(false);
    }
  }

  if (!turma) {
    return (
      <div className="relative min-h-screen bg-background">
        <PageBackground />
        <div className="relative z-10">
          <NavBar />
          <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
            <p className="text-sm text-muted-foreground">Turma não encontrada.</p>
            <Button asChild variant="outline" className="mt-4 gap-1.5">
              <a href="/aluno">
                <ArrowLeft className="size-4" /> Voltar
              </a>
            </Button>
          </div>
          <SiteFooter />
        </div>
      </div>
    );
  }

  const corTurma = serieClasses(serieIndexPorNumero(turma.serie));

  return (
    <div className="relative min-h-screen bg-background">
      <PageBackground />
      <div className="relative z-10">
        <NavBar />

        <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="mb-4 gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <a href="/aluno">
              <ArrowLeft className="size-4" /> Trocar de turma
            </a>
          </Button>

          <div className="mb-6 flex items-center gap-3">
            <span
              className={`flex size-12 items-center justify-center rounded-xl text-lg font-bold ${corTurma.bg} ${corTurma.text}`}
            >
              {turma.letra}
            </span>
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                {turma.serie} &quot;{turma.letra}&quot;
              </h1>
              <p className="text-sm text-muted-foreground">
                Prof(a). {turma.professorRegente} · Clique no seu nome
              </p>
            </div>
          </div>

          {turma.alunos.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Nenhum aluno cadastrado nessa turma ainda.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
              {turma.alunos.map((aluno) => (
                <button
                  key={aluno.id}
                  type="button"
                  onClick={() => {
                    setAlunoSelecionado(aluno);
                    setPin("");
                    setErro(null);
                  }}
                  className="group flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-border/60 bg-card p-3.5 text-center shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                >
                  <span
                    className={`flex size-10 items-center justify-center rounded-full text-sm font-bold ${corTurma.bg} ${corTurma.text}`}
                  >
                    {aluno.nome.charAt(0).toUpperCase()}
                  </span>
                  <span className="line-clamp-2 text-xs font-medium leading-tight text-foreground group-hover:text-primary">
                    {aluno.nome}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>

        <SiteFooter />
      </div>

      <Dialog
        open={alunoSelecionado !== null}
        onOpenChange={(open) => {
          if (!open) setAlunoSelecionado(null);
        }}
      >
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="size-4 text-primary" /> Olá,{" "}
              {alunoSelecionado?.nome.split(" ")[0]}!
            </DialogTitle>
            <DialogDescription>Digite seu PIN de 4 dígitos para entrar.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="pin">PIN</Label>
            <Input
              id="pin"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              autoFocus
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && pin.length === 4) confirmarPin();
              }}
              className="text-center font-mono text-2xl tracking-[0.5em]"
              placeholder="••••"
            />
            {erro ? <p className="text-sm text-destructive">{erro}</p> : null}
          </div>
          <Button
            onClick={confirmarPin}
            disabled={pin.length !== 4 || verificando}
            className="gap-1.5"
          >
            {verificando ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <KeyRound className="size-4" />
            )}
            Entrar
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
