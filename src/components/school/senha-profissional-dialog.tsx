import { KeyRound } from "lucide-react";
import { useEffect, useState } from "react";

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

interface SenhaProfissionalDialogProps {
  aberto: boolean;
  aoFechar: () => void;
  /** Nome de quem está entrando, para a pessoa conferir que clicou em si mesma. */
  nome: string;
  /** Linha de contexto: "Professor(a) regente · 3º Ano B". */
  contexto: string;
  /** Confere a senha digitada (o cálculo fica em profissional-acesso.ts). */
  verificar: (senha: string) => boolean;
  aoEntrar: () => void;
}

/**
 * Pedido da senha de 4 dígitos do profissional. Mesma ideia do PIN do aluno:
 * teclado numérico no celular, quatro casas e mensagem clara de para quem
 * pedir o número quando ele não bate.
 */
export function SenhaProfissionalDialog({
  aberto,
  aoFechar,
  nome,
  contexto,
  verificar,
  aoEntrar,
}: SenhaProfissionalDialogProps) {
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (aberto) {
      setSenha("");
      setErro(null);
    }
  }, [aberto]);

  function confirmar() {
    if (senha.length !== 4) {
      setErro("Digite os 4 dígitos.");
      return;
    }
    if (!verificar(senha)) {
      setErro("Senha incorreta. Peça o código à coordenação.");
      return;
    }
    aoEntrar();
  }

  return (
    <Dialog open={aberto} onOpenChange={(estado) => (estado ? null : aoFechar())}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="size-4 text-primary" /> {nome}
          </DialogTitle>
          <DialogDescription>{contexto}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Label htmlFor="senha-profissional">Senha de 4 dígitos</Label>
          <Input
            id="senha-profissional"
            inputMode="numeric"
            autoComplete="off"
            maxLength={4}
            value={senha}
            placeholder="••••"
            className="text-center text-lg tracking-[0.5em]"
            onChange={(e) => {
              setSenha(e.target.value.replace(/\D/g, "").slice(0, 4));
              setErro(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") confirmar();
            }}
          />
          {erro ? <p className="text-xs text-destructive">{erro}</p> : null}
          <p className="text-xs text-muted-foreground">
            A senha é gerada pelo sistema e fica com a coordenação, no painel da turma.
          </p>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={aoFechar}>
            Cancelar
          </Button>
          <Button onClick={confirmar} disabled={senha.length !== 4}>
            Entrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
