import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

// Stream direto do Zeno.fm (Jovem Pan FM 100.9) — link fixo, sem token que
// expira. <audio> toca origem cruzada sem bloqueio de CORS (isso só afeta
// fetch/XHR), então não precisa passar pelo servidor. Se o host principal
// falhar, cai pro espelho.
const STREAM_URLS = [
  "https://stream.zeno.fm/c45wbq2us3buv",
  "https://stream-284.zeno.fm/c45wbq2us3buv",
];

// Metadados "tocando agora" — mesmo provedor (Zeno.fm), via SSE público.
// Independente do stream de áudio em si, só liga enquanto está tocando.
const METADATA_URL = "https://api.zeno.fm/mounts/metadata/subscribe/c45wbq2us3buv";

type Status = "parado" | "carregando" | "tocando" | "erro";

interface JovemPanRadioContextValue {
  status: Status;
  /** O que está tocando agora, quando a emissora informa (rádio falada nem sempre tem). */
  streamTitle: string | null;
  alternarReproducao: () => void;
  parar: () => void;
}

const JovemPanRadioContext = createContext<JovemPanRadioContextValue | null>(null);

/** Zeno.fm manda "-" ou vazio quando não há metadado real de faixa. */
function limparStreamTitle(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const t = raw.trim();
  if (!t || /^-+$/.test(t)) return null;
  return t;
}

/**
 * Mantém o elemento <audio> da Jovem Pan News montado uma única vez na raiz
 * do app (fora do <Outlet />), então a transmissão não para ao navegar entre
 * páginas — só quando o ouvinte aperta parar, em qualquer página.
 */
export function JovemPanRadioProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const metadataRef = useRef<EventSource | null>(null);
  const [status, setStatus] = useState<Status>("parado");
  const [streamTitle, setStreamTitle] = useState<string | null>(null);

  function pararMetadados() {
    metadataRef.current?.close();
    metadataRef.current = null;
    setStreamTitle(null);
  }

  function iniciarMetadados() {
    if (metadataRef.current) return;
    try {
      const es = new EventSource(METADATA_URL);
      es.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as { streamTitle?: unknown };
          setStreamTitle(limparStreamTitle(payload.streamTitle));
        } catch {
          // Ignora eventos que não vierem no formato esperado.
        }
      };
      es.onerror = () => {
        // A conexão de metadados é só um extra decorativo — se falhar, o
        // áudio continua tocando normalmente, sem "tocando agora".
        pararMetadados();
      };
      metadataRef.current = es;
    } catch {
      // EventSource pode não existir em ambientes muito antigos — sem drama.
    }
  }

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "none";
    audio.addEventListener("waiting", () => setStatus("carregando"));
    audio.addEventListener("playing", () => {
      setStatus("tocando");
      iniciarMetadados();
    });
    audio.addEventListener("pause", () => {
      setStatus((s) => (s === "erro" ? s : "parado"));
      pararMetadados();
    });
    audio.addEventListener("error", () => {
      setStatus("erro");
      pararMetadados();
    });
    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.src = "";
      pararMetadados();
    };
    // iniciarMetadados/pararMetadados só usam refs e setState (identidade
    // estável) — não precisam entrar nas deps, e não podem: recriá-los a
    // cada render reabriria o <audio> do zero.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <JovemPanRadioContext.Provider value={{ status, streamTitle, alternarReproducao, parar }}>
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
  streamTitle: null,
  alternarReproducao: () => {},
  parar: () => {},
};

export function useJovemPanRadio(): JovemPanRadioContextValue {
  return useContext(JovemPanRadioContext) ?? FALLBACK;
}
