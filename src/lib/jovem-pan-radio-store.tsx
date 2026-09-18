import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

import { fetchRadioStreamUrl } from "@/lib/radio-stream-url";

type Status = "parado" | "carregando" | "tocando" | "erro";

interface JovemPanRadioContextValue {
  status: Status;
  alternarReproducao: () => void;
  parar: () => void;
}

const JovemPanRadioContext = createContext<JovemPanRadioContextValue | null>(null);

/**
 * Mantém o elemento <audio> da Jovem Pan News montado uma única vez na raiz
 * do app (fora do <Outlet />), então a transmissão não para ao navegar entre
 * páginas — só quando o ouvinte aperta parar, em qualquer página.
 */
export function JovemPanRadioProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [status, setStatus] = useState<Status>("parado");

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "none";
    audio.addEventListener("waiting", () => setStatus("carregando"));
    audio.addEventListener("playing", () => setStatus("tocando"));
    audio.addEventListener("pause", () => setStatus((s) => (s === "erro" ? s : "parado")));
    audio.addEventListener("error", () => setStatus("erro"));
    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []);

  async function alternarReproducao() {
    const audio = audioRef.current;
    if (!audio) return;
    if (status === "tocando") {
      audio.pause();
      return;
    }
    setStatus("carregando");
    try {
      // O link do stream expira — busca um novo a cada play para nunca ficar
      // parado com um token vencido.
      const url = await fetchRadioStreamUrl();
      audio.src = url;
      await audio.play();
    } catch {
      setStatus("erro");
    }
  }

  function parar() {
    audioRef.current?.pause();
  }

  return (
    <JovemPanRadioContext.Provider value={{ status, alternarReproducao, parar }}>
      {children}
    </JovemPanRadioContext.Provider>
  );
}

export function useJovemPanRadio(): JovemPanRadioContextValue {
  const ctx = useContext(JovemPanRadioContext);
  if (!ctx) throw new Error("useJovemPanRadio deve ser usado dentro de JovemPanRadioProvider");
  return ctx;
}
