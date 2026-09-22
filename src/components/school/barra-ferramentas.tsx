import { Sparkles } from "lucide-react";

/**
 * Faixa de entrada das ferramentas — a mesma no Espaço do Aluno, no do
 * Professor e no do Mediador.
 *
 * Ela é colorida de propósito: é o botão mais usado do site, e antes se
 * parecia demais com os cartões ao redor. Aqui vira uma faixa de cor cheia,
 * com o mesmo desenho em todas as áreas, para quem chega entender de longe
 * que é ali que se abrem as atividades.
 *
 * Como a rota muda em cada área (e o TanStack Router confere os parâmetros
 * em tempo de compilação), quem usa envolve isto num `<Link>` com
 * `className={CLASSES_BARRA_FERRAMENTAS}`.
 */
export const CLASSES_BARRA_FERRAMENTAS =
  "group flex cursor-pointer items-center gap-4 rounded-2xl bg-gradient-to-r from-violet-700 via-fuchsia-700 to-orange-700 p-4 text-white shadow-lg shadow-fuchsia-500/20 ring-1 ring-white/20 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-xl hover:shadow-fuchsia-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:p-5";

interface BarraFerramentasProps {
  titulo: string;
  descricao: string;
  /** Texto do lado direito ("Explorar →", "Abrir →"). */
  acao: string;
}

export function BarraFerramentas({ titulo, descricao, acao }: BarraFerramentasProps) {
  return (
    <>
      <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white/20 text-white ring-1 ring-white/30">
        <Sparkles className="size-6" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-bold tracking-tight text-white sm:text-lg">
          {titulo}
        </span>
        <span className="block text-xs text-white/90 sm:text-sm">{descricao}</span>
      </span>
      <span className="hidden shrink-0 rounded-full bg-white/20 px-3 py-1.5 text-sm font-semibold text-white ring-1 ring-white/30 transition-colors group-hover:bg-white/30 sm:block">
        {acao}
      </span>
    </>
  );
}
