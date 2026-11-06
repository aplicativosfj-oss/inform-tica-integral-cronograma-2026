import { CalendarPlus2, MonitorSmartphone } from "lucide-react";
import { useState } from "react";

import { ControleLaboratorio } from "@/components/school/laboratorio/controle";
import type { DadosLab } from "@/components/school/laboratorio/painel-agora";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Atalho da home para o professor logado: abre o controle numa janela, sem
 * sair da página, para marcar os alunos e ver o painel mudar na hora.
 */
export function MarcarAlunosCartao({
  dados,
  compacto = false,
  rotulo = "Marcar alunos",
}: {
  dados: DadosLab;
  /** Só o botão, para caber no cabeçalho de uma seção. */
  compacto?: boolean;
  rotulo?: string;
}) {
  const [aberto, setAberto] = useState(false);
  return (
    <>
      {compacto ? (
        <Button size="sm" className="h-9 rounded-full px-4" onClick={() => setAberto(true)}>
          <CalendarPlus2 className="size-4" /> {rotulo}
        </Button>
      ) : (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="space-y-3 p-4">
            <p className="text-sm font-semibold">Professor(a), quem vai ao laboratório hoje?</p>
            <p className="text-sm text-muted-foreground">
              Escolha a turma, toque nos nomes e diga por quanto tempo. O painel aqui ao lado muda
              na hora.
            </p>
            <Button size="lg" className="w-full" onClick={() => setAberto(true)}>
              <MonitorSmartphone /> Marcar alunos
            </Button>
          </CardContent>
        </Card>
      )}
      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="flex h-[min(88dvh,820px)] w-[calc(100vw-1rem)] max-w-5xl flex-col gap-2 overflow-hidden rounded-2xl p-3 sm:gap-3 sm:p-5">
          <DialogHeader className="shrink-0 pr-8">
            <DialogTitle>Programar turma e alunos</DialogTitle>
            <DialogDescription>
              Selecione a turma, escolha os alunos e defina a duração ou o horário. O sistema avisa sobre participações anteriores.
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-width:thin]">
            <ControleLaboratorio dados={dados} aoMarcar={() => setAberto(false)} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
