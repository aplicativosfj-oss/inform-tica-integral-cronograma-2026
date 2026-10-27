import { MonitorSmartphone } from "lucide-react";
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
export function MarcarAlunosCartao({ dados }: { dados: DadosLab }) {
  const [aberto, setAberto] = useState(false);
  return (
    <>
      <Card className="border-primary/40 bg-primary/5">
        <CardContent className="space-y-3 p-4">
          <p className="text-sm font-semibold">Professor(a): marque os alunos do dia</p>
          <p className="text-sm text-muted-foreground">
            Escolha a turma, toque nos alunos e defina o tempo. O painel ao lado atualiza na hora.
          </p>
          <Button size="lg" className="w-full" onClick={() => setAberto(true)}>
            <MonitorSmartphone /> Marcar alunos
          </Button>
        </CardContent>
      </Card>
      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Marcar alunos no laboratório</DialogTitle>
            <DialogDescription>
              O sistema avisa se o aluno já foi ao laboratório nesta semana ou neste mês.
            </DialogDescription>
          </DialogHeader>
          <ControleLaboratorio dados={dados} aoMarcar={() => setAberto(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
