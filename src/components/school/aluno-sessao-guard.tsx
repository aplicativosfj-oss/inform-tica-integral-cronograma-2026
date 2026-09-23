import { useEffect, useRef } from "react";
import { toast } from "sonner";

import {
  lerAlunoSessao,
  precisaLembrarSessaoRestaurada,
  registrarAtividadeAluno,
} from "@/lib/aluno-session";

const EVENTOS = ["pointerdown", "keydown", "scroll", "touchstart", "mousemove"] as const;
const INTERVALO_REGISTRO_MS = 5000;

/**
 * Cuida da sessão do aluno: renova o tempo a cada interação, desconecta depois
 * de 5 minutos parado e, se o aluno fechou a aba sem querer e voltou a tempo,
 * avisa que a conta continua conectada em vez de pedir o login de novo.
 */
export function AlunoSessaoGuard() {
  const havia = useRef(false);

  useEffect(() => {
    const inicial = lerAlunoSessao();
    havia.current = Boolean(inicial);
    if (inicial && precisaLembrarSessaoRestaurada()) {
      toast.info(`Você continua conectado(a), ${inicial.nome.split(" ")[0]}!`, {
        description:
          "Sua conta ficou aberta quando a aba foi fechada. É só continuar de onde parou.",
        duration: 9000,
      });
    }

    let ultimoRegistro = 0;
    const aoInteragir = () => {
      const agora = Date.now();
      if (agora - ultimoRegistro < INTERVALO_REGISTRO_MS) return;
      ultimoRegistro = agora;
      registrarAtividadeAluno();
    };
    EVENTOS.forEach((e) => window.addEventListener(e, aoInteragir, { passive: true }));

    const verificar = window.setInterval(() => {
      const atual = lerAlunoSessao();
      if (havia.current && !atual) {
        havia.current = false;
        toast.warning("Você foi desconectado(a) por ficar 5 minutos sem usar o sistema.", {
          description: "Entre de novo com o seu PIN quando quiser continuar.",
          duration: 10000,
        });
        // Recarrega para o menu e as telas do aluno refletirem a saída.
        const naAreaDoAluno = window.location.pathname.startsWith("/aluno");
        window.setTimeout(() => {
          if (naAreaDoAluno) window.location.assign("/aluno");
          else window.location.reload();
        }, 2500);
      } else if (atual) {
        havia.current = true;
      }
    }, 10_000);

    return () => {
      EVENTOS.forEach((e) => window.removeEventListener(e, aoInteragir));
      window.clearInterval(verificar);
    };
  }, []);

  return null;
}
