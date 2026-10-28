import { LogIn, Pause, Play, Square } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth-store";
import { encerrarGrupo, pausarGrupo, retomarGrupo, type GrupoLab } from "@/lib/laboratorio";
import { cn } from "@/lib/utils";

type Acao = "pausar" | "parar";

/**
 * Botões "Pausar/Retomar" e "Parar" da aula, para o professor, na página
 * inicial. Qualquer pessoa vê os botões, mas quem não está logado recebe uma
 * janelinha de entrada antes de qualquer coisa acontecer. Parar exige uma
 * justificativa, que fica guardada na marcação.
 */
export function ControleAula({
  g,
  aoMudar,
  compacto = false,
  className,
}: {
  g: GrupoLab;
  aoMudar: () => void;
  compacto?: boolean;
  className?: string;
}) {
  const { isAuthenticated, login } = useAuth();
  const pausada = g.pausadoEm !== null;
  const [pedirLogin, setPedirLogin] = useState<Acao | null>(null);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [entrando, setEntrando] = useState(false);
  const [erroLogin, setErroLogin] = useState<string | null>(null);
  const [parando, setParando] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [ocupado, setOcupado] = useState(false);

  async function alternarPausa() {
    setOcupado(true);
    try {
      if (pausada) await retomarGrupo(g.grupoId);
      else await pausarGrupo(g.grupoId);
      toast.success(pausada ? "Aula retomada. A contagem voltou a andar." : "Aula pausada.");
      aoMudar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível concluir.");
    } finally {
      setOcupado(false);
    }
  }

  async function parar() {
    if (motivo.trim().length < 3) return;
    setOcupado(true);
    try {
      await encerrarGrupo(g.grupoId, motivo);
      toast.success("Aula encerrada. A justificativa ficou registrada.");
      setParando(false);
      setMotivo("");
      aoMudar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível concluir.");
    } finally {
      setOcupado(false);
    }
  }

  function executar(acao: Acao) {
    if (acao === "pausar") void alternarPausa();
    else setParando(true);
  }

  function clicar(acao: Acao) {
    if (!isAuthenticated) {
      setErroLogin(null);
      setPedirLogin(acao);
      return;
    }
    executar(acao);
  }

  async function entrar(ev: React.FormEvent) {
    ev.preventDefault();
    if (!pedirLogin) return;
    setEntrando(true);
    setErroLogin(null);
    const erro = await login(email, senha);
    setEntrando(false);
    if (erro) {
      setErroLogin(erro);
      return;
    }
    const acao = pedirLogin;
    setPedirLogin(null);
    setSenha("");
    executar(acao);
  }

  return (
    <>
      <div className={cn("flex flex-wrap gap-2", className)}>
        <Button
          type="button"
          size={compacto ? "sm" : "default"}
          disabled={ocupado}
          onClick={() => clicar("pausar")}
          className={cn(
            "rounded-full",
            pausada
              ? "bg-mint text-ink hover:bg-mint/90"
              : "border border-white/30 bg-white/15 text-white hover:bg-white/25",
          )}
        >
          {pausada ? <Play /> : <Pause />} {pausada ? "Retomar" : "Pausar"}
        </Button>
        <Button
          type="button"
          size={compacto ? "sm" : "default"}
          disabled={ocupado}
          onClick={() => clicar("parar")}
          className="rounded-full bg-red-600 text-white hover:bg-red-700"
        >
          <Square /> Parar aula
        </Button>
      </div>

      <Dialog open={pedirLogin !== null} onOpenChange={(v) => (v ? null : setPedirLogin(null))}>
        <DialogContent className="max-w-sm">
          <form onSubmit={entrar} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <LogIn className="size-5 text-primary" aria-hidden /> Entre para controlar a aula
              </DialogTitle>
              <DialogDescription>
                Só o professor pode {pedirLogin === "parar" ? "parar" : "pausar"} a aula.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-1.5">
              <Label htmlFor="ca-email">E-mail</Label>
              <Input
                id="ca-email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ca-senha">Senha</Label>
              <Input
                id="ca-senha"
                type="password"
                autoComplete="current-password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
              />
            </div>
            {erroLogin ? <p className="text-sm text-destructive">{erroLogin}</p> : null}
            <DialogFooter>
              <Button type="submit" disabled={entrando}>
                {entrando ? "Entrando…" : "Entrar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={parando} onOpenChange={(v) => (v ? null : setParando(false))}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Square className="size-5 text-red-600" aria-hidden /> Parar a aula agora?
            </DialogTitle>
            <DialogDescription>
              A turma sai do laboratório neste instante. Conte o motivo: a justificativa fica no
              histórico.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="ca-motivo">Justificativa (obrigatória)</Label>
            <Textarea
              id="ca-motivo"
              rows={3}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex.: acabou a energia, a turma foi chamada para o lanche…"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setParando(false)}>
              Voltar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={ocupado || motivo.trim().length < 3}
              onClick={() => void parar()}
            >
              Parar aula
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
