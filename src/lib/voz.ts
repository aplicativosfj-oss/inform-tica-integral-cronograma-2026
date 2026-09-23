/**
 * Voz da alfabetização.
 *
 * Usa a síntese de fala do próprio navegador (Web Speech API): não precisa
 * baixar áudio nenhum, funciona sem internet depois que a voz do sistema
 * está instalada e fala qualquer palavra — inclusive as que a criança
 * monta. Gravar dezenas de arquivos de áudio resolveria só as palavras
 * previstas, e não a que o aluno digitar.
 *
 * Quando o computador não tem voz em português, nada quebra: a ferramenta
 * simplesmente não fala, e todos os jogos continuam jogáveis sem som.
 */

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
 */
export function falar(texto: string, devagar = false): void {
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
