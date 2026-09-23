/**
 * Voz da alfabetização.
 *
 * Duas camadas, nessa ordem:
 *
 * 1. Nuvem (Google Cloud Text-to-Speech, voz "Wavenet" pt-BR) — som bem mais
 *    natural, quase humano. Passa por uma Edge Function do Supabase
 *    (`supabase/functions/tts`) para a chave da API nunca aparecer no
 *    navegador. Precisa de internet e da função configurada (ver o README
 *    dentro da pasta da função); enquanto isso não estiver pronto, ou se a
 *    conexão cair, cai sozinho na camada 2 sem travar o jogo.
 * 2. Navegador (Web Speech API) — a voz do próprio sistema, sem precisar de
 *    internet depois de instalada. Fica como rede de segurança: fala
 *    qualquer palavra, inclusive as que a criança monta, mesmo offline.
 *
 * Quando nenhuma das duas está disponível, nada quebra: a ferramenta
 * simplesmente não fala, e todos os jogos continuam jogáveis sem som.
 */
import { supabase } from "@/lib/supabase-client";

// Guarda o áudio já pedido à nuvem nesta visita (chave = "devagar?texto"):
// letra e sílaba se repetem várias vezes num único jogo, e reouvir não deve
// gastar cota da API nem esperar a rede de novo.
const cacheAudioNuvem = new Map<string, string>();
let ultimoAudioTocando: HTMLAudioElement | null = null;

/** Pede o áudio à Edge Function e toca; `false` se falhar por qualquer motivo. */
async function falarNaNuvem(texto: string, devagar: boolean): Promise<boolean> {
  const chave = `${devagar ? "1" : "0"}:${texto}`;
  try {
    let base64 = cacheAudioNuvem.get(chave);
    if (!base64) {
      // A função pode não estar configurada ainda (sem chave da API) ou a
      // rede pode estar fora — 5s é tempo de sobra numa conexão normal sem
      // deixar a criança esperando caso esteja mesmo indisponível.
      const resultado = await Promise.race([
        supabase.functions.invoke<{ audioBase64?: string; error?: string }>("tts", {
          body: { texto, devagar },
        }),
        new Promise<never>((_, rejeitar) => setTimeout(() => rejeitar(new Error("tempo")), 5000)),
      ]);
      if (resultado.error || !resultado.data?.audioBase64) return false;
      base64 = resultado.data.audioBase64;
      cacheAudioNuvem.set(chave, base64);
    }
    ultimoAudioTocando?.pause();
    const audio = new Audio(`data:audio/mp3;base64,${base64}`);
    ultimoAudioTocando = audio;
    await audio.play();
    return true;
  } catch {
    return false;
  }
}

let vozPt: SpeechSynthesisVoice | null = null;
let procurou = false;

/**
 * Nem toda voz "pt-BR" instalada soa bem: o Windows, por exemplo, costuma
 * trazer vozes robóticas antigas (Maria, Helena) junto com vozes muito mais
 * naturais (as "Online (Natural)" do Edge, ou as do Google no Chrome). Sem
 * escolher a dedo, o navegador pode pegar a pior — e é isso que deixava a
 * leitura de letra e sílaba com aquele som "feio". A pontuação abaixo
 * favorece as vozes conhecidas por soar mais natural; o nome de cada voz
 * varia por navegador/SO, então a lista cobre os termos mais comuns.
 */
const PISTAS_VOZ_BOA = [
  "natural",
  "neural",
  "online",
  "google",
  "francisca",
  "luciana",
  "fernanda",
  "thalita",
  "multilingual",
];

function pontuarVoz(v: SpeechSynthesisVoice): number {
  const lang = v.lang.toLowerCase();
  const nome = v.name.toLowerCase();
  let pontos = 0;
  if (lang.startsWith("pt-br")) pontos += 10;
  else if (lang.startsWith("pt")) pontos += 5;
  else return -1;
  if (PISTAS_VOZ_BOA.some((pista) => nome.includes(pista))) pontos += 5;
  // Vozes "não locais" (a maioria das de nuvem, tipo Google/Microsoft
  // Online) tendem a soar bem mais naturais que a voz local do sistema.
  if (!v.localService) pontos += 2;
  return pontos;
}

function escolherVoz(): SpeechSynthesisVoice | null {
  if (procurou) return vozPt;
  procurou = true;
  try {
    const vozes = window.speechSynthesis.getVoices();
    const candidatas = vozes
      .map((v) => ({ v, pontos: pontuarVoz(v) }))
      .filter((c) => c.pontos >= 0)
      .sort((a, b) => b.pontos - a.pontos);
    vozPt = candidatas[0]?.v ?? null;
  } catch {
    vozPt = null;
  }
  return vozPt;
}

export function vozDisponivel(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/**
 * Fala um texto. `devagar` é para letra e sílaba, que a criança precisa ouvir
 * separado; palavra e frase saem em velocidade quase normal.
 *
 * Tenta a voz de nuvem primeiro (mais natural) e só usa a do navegador se
 * aquela falhar — por isso é assíncrona por dentro mas continua podendo ser
 * chamada como `falar("oi")`, sem `await`, nos lugares que já usavam assim.
 */
export function falar(texto: string, devagar = false): void {
  if (!texto.trim()) return;
  falarNaNuvem(texto, devagar)
    .then((tocou) => {
      if (!tocou) falarNoNavegador(texto, devagar);
    })
    .catch(() => falarNoNavegador(texto, devagar));
}

function falarNoNavegador(texto: string, devagar: boolean): void {
  if (!vozDisponivel() || !texto.trim()) return;
  try {
    window.speechSynthesis.cancel();
    const fala = new SpeechSynthesisUtterance(texto);
    const voz = escolherVoz();
    if (voz) {
      fala.voice = voz;
      fala.lang = voz.lang;
    } else {
      fala.lang = "pt-BR";
    }
    // Devagar demais (0.6) soava arrastado e robótico nas vozes boas; 0.72
    // ainda dá pra criança acompanhar sílaba por sílaba sem esticar o som.
    fala.rate = devagar ? 0.72 : 0.95;
    // Pitch alterado (1.1) deixava a voz com um tom fino/artificial por
    // cima da voz natural do sistema — 1 é o tom original da própria voz.
    fala.pitch = 1;
    // Se a voz escolhida falhar (ex.: precisa de internet e ela caiu), cai
    // para a voz padrão do navegador em vez de ficar muda.
    fala.onerror = () => {
      if (!voz) return;
      try {
        const tentativa = new SpeechSynthesisUtterance(texto);
        tentativa.lang = "pt-BR";
        tentativa.rate = fala.rate;
        window.speechSynthesis.speak(tentativa);
      } catch {
        // idem: segue mudo.
      }
    };
    window.speechSynthesis.speak(fala);
  } catch {
    // Sem voz instalada ou bloqueada: o jogo segue mudo.
  }
}

/** As vozes chegam depois do carregamento em alguns navegadores. */
export function prepararVoz(): void {
  if (!vozDisponivel()) return;
  try {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener(
      "voiceschanged",
      () => {
        procurou = false;
        escolherVoz();
      },
      { once: true },
    );
  } catch {
    // idem
  }
}

/** O som que se usa para ler a letra sozinha: "a", "bê", "cê"... */
export function nomeDaLetra(letra: string): string {
  const especiais: Record<string, string> = {
    B: "bê",
    C: "cê",
    D: "dê",
    F: "éfe",
    G: "gê",
    H: "agá",
    J: "jota",
    K: "cá",
    L: "éle",
    M: "ême",
    N: "êne",
    P: "pê",
    Q: "quê",
    R: "érre",
    S: "ésse",
    T: "tê",
    V: "vê",
    W: "dábliu",
    X: "xis",
    Y: "ípsilon",
    Z: "zê",
  };
  return especiais[letra.toUpperCase()] ?? letra.toLowerCase();
}
