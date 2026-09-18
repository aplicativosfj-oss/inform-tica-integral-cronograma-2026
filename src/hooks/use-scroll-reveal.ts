import { useEffect, useRef, useState } from "react";

/**
 * Revela um elemento (fade + leve deslocamento para cima) na primeira vez
 * que ele entra na tela ao rolar a página — depois de revelado, fica
 * revelado (não pisca de novo ao rolar para frente e para trás).
 *
 * Retorna um `ref` para colocar no elemento e a classe CSS a aplicar.
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const elemento = ref.current;
    if (!elemento || typeof IntersectionObserver === "undefined") {
      setVisivel(true);
      return;
    }

    // Quem já tinha o conteúdo visível ao carregar a página não precisa
    // esperar nenhuma animação — só quem rola até ele depois é que vê o
    // efeito de entrada.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisivel(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );
    observer.observe(elemento);
    return () => observer.disconnect();
  }, []);

  return {
    ref,
    className: visivel ? "animate-reveal-in" : "opacity-0",
  };
}
