/**
 * Voz da alfabetização.
 *
 * Usa a síntese de fala do próprio navegador (Web Speech API): não precisa
 * baixar áudio nenhum, funciona sem internet depois que a voz do sistema
 * está instalada e fala qualquer palavra — inclusive as que a criança
 * monta. Gravar 70 arquivos de áudio resolveria só as 70 palavras previstas.
 *
 * Quando o computador não tem voz em português, nada quebra: a ferramenta
 * simplesmente não fala, e todos os jogos continuam jogáveis sem som.
 */

let vozPt: SpeechSynthesisVoice | null = null;
let procurou = false;

function escolherVoz(): SpeechSynthesisVoice | null {
  if (procurou) return vozPt;
  procurou = true;
  try {
    const vozes = window.speechSynthesis.getVoices();
    vozPt =
      vozes.find((v) => v.lang.toLowerCase().startsWith("pt-br")) ??
      vozes.find((v) => v.lang.toLowerCase().startsWith("pt")) ??
      null;
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
 */
export function falar(texto: string, devagar = false): void {
  if (!vozDisponivel() || !texto.trim()) return;
  try {
    window.speechSynthesis.cancel();
    const fala = new SpeechSynthesisUtterance(texto);
    const voz = escolherVoz();
    if (voz) fala.voice = voz;
    fala.lang = "pt-BR";
    fala.rate = devagar ? 0.6 : 0.9;
    fala.pitch = 1.1;
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
