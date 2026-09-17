import { createFileRoute } from "@tanstack/react-router";
import { LogOut, RotateCcw, Save } from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DashboardShell } from "@/components/school/dashboard-shell";
import { useAppStore } from "@/lib/app-store";
import { useAuth } from "@/lib/auth-store";
import type { ScheduleConfig } from "@/lib/types";

export const Route = createFileRoute("/dashboard/configuracoes")({
  component: ConfiguracoesPage,
});

function ConfiguracoesPage() {
  const { config, updateConfig, resetToSeed } = useAppStore();
  const { logout } = useAuth();
  const [form, setForm] = useState<ScheduleConfig>(config);

  function set<K extends keyof ScheduleConfig>(key: K, value: ScheduleConfig[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <DashboardShell>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground">
          Ajuste os dados da escola e as regras usadas para gerar a agenda automaticamente.
        </p>
      </div>

      <form
        className="flex max-w-2xl flex-col gap-6"
        onSubmit={(event) => {
          event.preventDefault();
          updateConfig(form);
          toast.success("Configurações salvas.");
        }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Escola</CardTitle>
            <CardDescription>Informações exibidas na página inicial e na agenda.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Field label="Nome da escola">
              <Input value={form.nomeEscola} onChange={(e) => set("nomeEscola", e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="INEP">
                <Input value={form.inep} onChange={(e) => set("inep", e.target.value)} />
              </Field>
              <Field label="Professor de informática">
                <Input
                  value={form.professorInformatica}
                  onChange={(e) => set("professorInformatica", e.target.value)}
                />
              </Field>
            </div>
            <Field label="Endereço">
              <Input value={form.endereco} onChange={(e) => set("endereco", e.target.value)} />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Regras de revezamento</CardTitle>
            <CardDescription>
              Como a agenda calcula os horários e o revezamento dos grupos automaticamente. A
              primeira aula depois de um intervalo só começa quando ele termina — inclua na "Fim do
              almoço/descanso" o tempo que as crianças levam para se organizar antes de vir para o
              laboratório.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Início das aulas">
                <Input
                  type="time"
                  value={form.horaInicio}
                  onChange={(e) => set("horaInicio", e.target.value)}
                />
              </Field>
              <Field label="Fim das aulas">
                <Input
                  type="time"
                  value={form.horaFim}
                  onChange={(e) => set("horaFim", e.target.value)}
                />
              </Field>
              <Field label="Início do almoço/descanso">
                <Input
                  type="time"
                  value={form.intervaloInicio}
                  onChange={(e) => set("intervaloInicio", e.target.value)}
                />
              </Field>
              <Field label="Fim do almoço/descanso">
                <Input
                  type="time"
                  value={form.intervaloFim}
                  onChange={(e) => set("intervaloFim", e.target.value)}
                />
              </Field>
              <Field label="Início do recreio (opcional)">
                <Input
                  type="time"
                  value={form.recreioInicio ?? ""}
                  onChange={(e) => set("recreioInicio", e.target.value || undefined)}
                />
              </Field>
              <Field label="Fim do recreio (opcional)">
                <Input
                  type="time"
                  value={form.recreioFim ?? ""}
                  onChange={(e) => set("recreioFim", e.target.value || undefined)}
                />
              </Field>
              <Field label="Duração da janela por turma (min)">
                <Input
                  type="number"
                  min={15}
                  step={5}
                  value={form.duracaoSlotMinutos}
                  onChange={(e) => set("duracaoSlotMinutos", Number(e.target.value))}
                />
              </Field>
              <Field label="Duração de cada grupo (min)">
                <Input
                  type="number"
                  min={5}
                  step={5}
                  value={form.duracaoGrupoMinutos}
                  onChange={(e) => set("duracaoGrupoMinutos", Number(e.target.value))}
                />
              </Field>
              <Field label="Nº de computadores">
                <Input
                  type="number"
                  min={1}
                  value={form.numeroComputadores}
                  onChange={(e) => set("numeroComputadores", Number(e.target.value))}
                />
              </Field>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Conteúdo programático por dia</CardTitle>
            <CardDescription>
              Esse texto aparece no cronômetro ao vivo enquanto a turma está no laboratório.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {form.diasSemana.map((dia) => (
              <Field key={dia} label={dia}>
                <Input
                  value={form.conteudoPorDia?.[dia] ?? ""}
                  placeholder="Ex.: Digitação e edição de texto"
                  onChange={(e) =>
                    set("conteudoPorDia", { ...(form.conteudoPorDia ?? {}), [dia]: e.target.value })
                  }
                />
              </Field>
            ))}
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button type="submit">
            <Save /> Salvar configurações
          </Button>

          <div className="flex gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="outline">
                  <RotateCcw /> Restaurar padrão
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Restaurar dados padrão?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Isso substitui as turmas, alunos e configurações atuais pelos dados iniciais do
                    sistema.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      resetToSeed();
                      toast.success("Dados restaurados.");
                    }}
                  >
                    Restaurar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button type="button" variant="outline" onClick={logout}>
              <LogOut /> Sair da conta
            </Button>
          </div>
        </div>
      </form>
    </DashboardShell>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
