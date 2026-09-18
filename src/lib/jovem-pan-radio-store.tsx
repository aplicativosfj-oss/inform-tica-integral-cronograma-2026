import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

// Stream direto do Zeno.fm (Jovem Pan FM 100.9) — link fixo, sem token que
// expira. <audio> toca origem cruzada sem bloqueio de CORS (isso só afeta
// fetch/XHR), então não precisa passar pelo servidor. Se o host principal
// falhar, cai pro espelho.
const STREAM_URLS = [
  "https://stream.zeno.fm/c45wbq2us3buv",
  "https://stream-284.zeno.fm/c45wbq2us3buv",
];

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
    for (const url of STREAM_URLS) {
      try {
        audio.src = url;
        await audio.play();
        return;
      } catch {
        // tenta o próximo espelho
      }
    }
    setStatus("erro");
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

/**
 * Fora do provider (páginas de erro/404 ou árvores isoladas) o player
 * simplesmente fica inerte, em vez de derrubar a tela inteira.
 */
const FALLBACK: JovemPanRadioContextValue = {
  status: "parado",
  alternarReproducao: () => {},
  parar: () => {},
};

export function useJovemPanRadio(): JovemPanRadioContextValue {
  return useContext(JovemPanRadioContext) ?? FALLBACK;
}
