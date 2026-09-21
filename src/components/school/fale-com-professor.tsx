import {
  Copy,
  HeartHandshake,
  Lightbulb,
  Mail,
  MessageCircle,
  MessageCircleHeart,
  Siren,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/app-store";

const EMAIL_CONTATO = "aplicativosfj@gmail.com";
/** WhatsApp do professor de informática: (68) 99203-1340, no formato internacional. */
const WHATSAPP = "5568992031340";
const WHATSAPP_EXIBICAO = "(68) 99203-1340";

const ASSUNTOS = [
  {
    id: "importante",
    rotulo: "Algo importante",
    descricao: "Um aviso sobre a turma, a rotina ou um aluno.",
    icone: Siren,
    cor: "text-rose-300",
  },
  {
    id: "sugestao",
    rotulo: "Sugestão ou ideia",
    descricao: "Uma atividade, um conteúdo ou uma melhoria no sistema.",
    icone: Lightbulb,
    cor: "text-amber-300",
  },
  {
    id: "especialidade",
    rotulo: "Especialidade de uma criança",
    descricao: "Como adaptar as aulas para quem precisa de atendimento especializado.",
    icone: HeartHandshake,
    cor: "text-fuchsia-300",
  },
] as const;

/**
 * Convite aos profissionais da escola (professor regente, mediador,
 * cuidador, coordenação) para conversar com o professor de informática.
 * Cada assunto abre um e-mail já com título e um roteiro curto.
 */
export function FaleComProfessor({
  remetente,
  compacto = false,
}: {
  remetente?: string;
  /** Versão estreita, para colunas laterais. */
  compacto?: boolean;
}) {
  const { config } = useAppStore();
  const professor = config.professorInformatica || "professor de informática";

  function linkEmail(assunto: (typeof ASSUNTOS)[number]) {
    const titulo = `[Agenda de Informática] ${assunto.rotulo}${remetente ? ` — ${remetente}` : ""}`;
    const corpo = [
      `Olá, professor ${professor}!`,
      "",
      `Assunto: ${assunto.rotulo}`,
      "Turma / criança (se for o caso): ",
      "",
      "Mensagem:",
      "",
      "",
      remetente ? `Atenciosamente,\n${remetente}` : "Atenciosamente,",
    ].join("\n");
    return `mailto:${EMAIL_CONTATO}?subject=${encodeURIComponent(titulo)}&body=${encodeURIComponent(corpo)}`;
  }

  function linkWhatsApp(assunto?: (typeof ASSUNTOS)[number]) {
    const linhas = [`Olá, professor ${professor}!`];
    if (remetente) linhas.push(`Aqui é ${remetente}.`);
    if (assunto) linhas.push(`Assunto: ${assunto.rotulo}.`);
    const texto = `${linhas.join("\n")}\n\n`;
    return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`;
  }

  async function copiarEmail() {
    try {
      await navigator.clipboard.writeText(EMAIL_CONTATO);
      toast.success("E-mail copiado.");
    } catch {
      toast.error("Não foi possível copiar. O e-mail é " + EMAIL_CONTATO);
    }
  }

  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-700 via-indigo-700 to-violet-700 text-white shadow-xl shadow-indigo-950/30 ring-1 ring-white/15">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-cyan-300/20 blur-3xl"
      />
      <div className={`relative flex flex-col ${compacto ? "gap-4 p-5" : "gap-5 p-5 sm:p-6"}`}>
        <div className="flex items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
            <MessageCircleHeart className="size-6" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-200">
              Canal com o laboratório de informática
            </p>
            <h2 className={`font-bold tracking-tight ${compacto ? "text-lg" : "text-xl"}`}>
              Fale com o professor {professor}
            </h2>
            <p className={`mt-1 max-w-3xl text-sm text-white/85 ${compacto ? "hidden" : ""}`}>
              Professor(a), mediador(a) ou cuidador(a): sua informação faz diferença nas aulas.
              Converse com o professor de informática sempre que houver algo importante, uma
              sugestão ou ideia, ou uma orientação sobre a especialidade de uma criança — assim as
              atividades no laboratório ficam mais adequadas para cada aluno.
            </p>
          </div>
        </div>

        {compacto ? (
          <p className="-mt-1 text-sm text-white/85">
            Algo importante, uma sugestão ou a especialidade de uma criança? Converse com o
            professor de informática.
          </p>
        ) : null}
        <div className={`grid gap-2.5 ${compacto ? "" : "sm:grid-cols-3"}`}>
          {ASSUNTOS.map((a) => {
            const Icone = a.icone;
            return (
              <div
                key={a.id}
                className="flex flex-col gap-1 rounded-xl bg-white/10 p-3.5 ring-1 ring-white/20"
              >
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <Icone className={`size-4 ${a.cor}`} /> {a.rotulo}
                </span>
                <span className="text-xs text-white/75">{a.descricao}</span>
                <span className="mt-2 flex flex-wrap gap-1.5">
                  <a
                    href={linkWhatsApp(a)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-emerald-400"
                  >
                    <MessageCircle className="size-3.5" /> WhatsApp
                  </a>
                  <a
                    href={linkEmail(a)}
                    className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold text-white ring-1 ring-white/25 transition-colors hover:bg-white/25"
                  >
                    <Mail className="size-3.5" /> E-mail
                  </a>
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Button asChild size="sm" className="bg-emerald-500 text-white hover:bg-emerald-400">
            <a href={linkWhatsApp()} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="size-4" /> {WHATSAPP_EXIBICAO}
            </a>
          </Button>
          <Button asChild size="sm" className="bg-white text-indigo-900 hover:bg-white/90">
            <a href={`mailto:${EMAIL_CONTATO}`}>
              <Mail className="size-4" /> {EMAIL_CONTATO}
            </a>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-white hover:bg-white/15 hover:text-white"
            onClick={copiarEmail}
          >
            <Copy className="size-4" /> Copiar e-mail
          </Button>
          {compacto ? null : (
            <span className="text-xs text-white/70">
              Ou procure o professor pessoalmente no laboratório.
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
