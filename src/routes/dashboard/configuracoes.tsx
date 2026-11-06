import { createFileRoute } from "@tanstack/react-router";
import { LogOut, Monitor, MonitorOff, RotateCcw, Save, ShieldCheck, Ban } from "lucide-react";
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
import { ImportarNascimentos } from "@/components/school/importar-nascimentos";
import { useAppStore } from "@/lib/app-store";
import { useConfirmar } from "@/lib/confirm-store";
import { useAuth } from "@/lib/auth-store";
import type { ScheduleConfig } from "@/lib/types";

export const Route = createFileRoute("/dashboard/configuracoes")({
  component: ConfiguracoesPage,
  head: () => ({
    meta: [
      { title: "Configurações · Informática Dr. Eiraldo" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function ConfiguracoesPage() {
  const { config, updateConfig, resetToSeed } = useAppStore();
  const confirmar = useConfirmar();
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

      <Card className="mb-6 max-w-2xl border-primary/20 bg-gradient-to-br from-primary/[0.06] via-card to-card shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><ShieldCheck className="size-5" /></span>
            <div>
              <CardTitle className="text-base">Proteção global de tela</CardTitle>
              <CardDescription>Controle centralizado do descanso de tela em todos os navegadores.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">{config.protetorForcado ? "Proteção ativada para visitantes" : "Proteção global desativada"}</p>
            <p className="mt-1 max-w-xl text-xs leading-relaxed text-muted-foreground">
              Quando ativada, visitantes sem login veem imediatamente o descanso de tela em qualquer dispositivo,
              mesmo durante uma aula. Somente uma conta administrativa pode desativar. Administradores logados
              continuam acessando o painel normalmente.
            </p>
          </div>
          <Button type="button" variant={config.protetorForcado ? "destructive" : "default"} className="shrink-0"
            onClick={() => {
              const ativar = !config.protetorForcado;
              updateConfig({ protetorForcado: ativar });
              toast.success(ativar ? "Proteção global ativada." : "Proteção global desativada.");
            }}>
            {config.protetorForcado ? <><MonitorOff className="mr-2 size-4" /> Desativar proteção</> : <><Monitor className="mr-2 size-4" /> Ativar proteção</>}
          </Button>
        </CardContent>
      </Card>

      <Card className="mb-6 max-w-2xl border-amber-500/25 bg-amber-500/[0.035] shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <span className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600"><Ban className="size-5" /></span>
            <div>
              <CardTitle className="text-base">Desativar descanso de tela</CardTitle>
              <CardDescription>Interruptor geral para impedir que qualquer tela de descanso seja exibida.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">{config.descansoTelaDesativado ? "Descanso de tela desativado em toda a plataforma" : "Descanso de tela funcionando normalmente"}</p>
            <p className="mt-1 max-w-xl text-xs leading-relaxed text-muted-foreground">
              Ao ativar esta opção, o descanso automático e a proteção global forçada deixam de funcionar
              para todos os visitantes e navegadores. O administrador pode reativar quando quiser.
            </p>
          </div>
          <Button type="button" variant={config.descansoTelaDesativado ? "default" : "outline"} className="shrink-0"
            onClick={() => {
              const desativar = !config.descansoTelaDesativado;
              updateConfig({ descansoTelaDesativado: desativar });
              toast.success(desativar ? "Descanso de tela desativado para todos." : "Descanso de tela reativado.");
            }}>
            {config.descansoTelaDesativado ? <><Monitor className="mr-2 size-4" /> Reativar descanso</> : <><Ban className="mr-2 size-4" /> Desativar descanso</>}
          </Button>
        </CardContent>
      </Card>

      <form
        className="flex max-w-2xl flex-col gap-6"
        onSubmit={async (event) => {
          event.preventDefault();
          const ok = await confirmar({
            titulo: "Salvar configurações?",
            descricao:
              "Isso altera os horários e regras usados para gerar a agenda de todo mundo imediatamente.",
          });
          if (!ok) return;
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

        <ImportarNascimentos />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Início oficial de uso</CardTitle>
            <CardDescription>
              Registros de presença/falta salvos antes desta data são tratados como teste (feito
              durante a configuração do sistema) e ficam ocultos dos relatórios de frequência. Deixe
              em branco para contar tudo desde o primeiro registro.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Field label="A partir de (opcional)">
              <Input
                type="date"
                className="w-48"
                value={form.dataInicioOperacao ?? ""}
                onChange={(e) => set("dataInicioOperacao", e.target.value || undefined)}
              />
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
