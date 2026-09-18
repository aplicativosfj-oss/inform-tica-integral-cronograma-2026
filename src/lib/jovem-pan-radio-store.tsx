import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

// TODO: troque pela URL direta do stream (termina em .aac ou .mp3), não a
// página institucional do StreamTheWorld. Peça ao provedor (ou inspecione a
// aba de rede do player oficial da Jovem Pan News) o endereço real.
const STREAM_URL = "https://streamtheworld.com";

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
    audio.src = STREAM_URL;
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

  function alternarReproducao() {
    const audio = audioRef.current;
    if (!audio) return;
    if (status === "tocando") {
      audio.pause();
      return;
    }
    setStatus("carregando");
    audio.play().catch(() => setStatus("erro"));
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
