import { useEffect, useRef, useState } from "react";

/**
 * Anima um número contando de 0 até `valor`, uma única vez, na primeira vez
 * que o elemento aparece na tela — dá vida aos números de destaque (turmas,
 * alunos, computadores) sem exigir nenhuma biblioteca de animação.
 */
export function useCountUp(valor: number, duracaoMs = 900) {
  const ref = useRef<HTMLElement | null>(null);
  const [exibido, setExibido] = useState(0);
  const jaAnimouRef = useRef(false);

  useEffect(() => {
    const elemento = ref.current;
    if (!elemento || typeof IntersectionObserver === "undefined") {
      setExibido(valor);
      return;
    }

    function animar() {
      if (jaAnimouRef.current) return;
      jaAnimouRef.current = true;
      const inicio = performance.now();
      function passo(agora: number) {
        const progresso = Math.min(1, (agora - inicio) / duracaoMs);
        // easeOutCubic: rápido no começo, desacelera perto do valor final —
        // parece mais um contador de verdade do que uma rampa linear.
        const suavizado = 1 - (1 - progresso) ** 3;
        setExibido(Math.round(valor * suavizado));
        if (progresso < 1) requestAnimationFrame(passo);
      }
      requestAnimationFrame(passo);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          animar();
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(elemento);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valor, duracaoMs]);

  return { ref, exibido };
}
