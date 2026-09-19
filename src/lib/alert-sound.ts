/**
 * Simple Web Audio alert used when a group's turn ends.
 * Browsers only allow audio after a user gesture, so `unlockAlertSound`
 * must be called from a click before `playAlertaTroca` can be heard.
 */
let audioContext: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!audioContext) audioContext = new Ctor();
  return audioContext;
}

export async function unlockAlertSound(): Promise<boolean> {
  const ctx = getContext();
  if (!ctx) return false;
  try {
    if (ctx.state === "suspended") await ctx.resume();
    return ctx.state === "running";
  } catch {
    return false;
  }
}

/** Three short beeps announcing that the group must rotate. */
export function playAlertaTroca(): void {
  const ctx = getContext();
  if (!ctx || ctx.state !== "running") return;

  [0, 0.45, 0.9].forEach((offset, index) => {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = ctx.currentTime + offset;

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(index === 2 ? 660 : 880, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.25, start + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);

    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(start);
    oscillator.stop(start + 0.4);
  });
}

/**
 * Sinal de encerramento da aula: três notas descendentes (sol–mi–dó), cada
 * uma com ataque suave e cauda longa, como um carrilhão.
 *
 * Deliberadamente diferente do aviso de troca de grupo, que é curto, agudo e
 * repetido — aquele pede uma ação imediata. Este anuncia o fim, e num
 * laboratório com criança um som brusco no encerramento agita a turma justo
 * na hora de organizar a saída.
 */
export function playFimDeAula(): void {
  const ctx = getContext();
  if (!ctx || ctx.state !== "running") return;

  const notas = [783.99, 659.25, 523.25]; // sol5, mi5, dó5

  notas.forEach((frequencia, indice) => {
    const inicio = ctx.currentTime + indice * 0.42;
    const duracao = indice === notas.length - 1 ? 1.5 : 0.9;

    const oscilador = ctx.createOscillator();
    const ganho = ctx.createGain();

    // Triangular no lugar de senoidal: dá um harmônico a mais, o que soa
    // como sino em vez de teste de áudio.
    oscilador.type = "triangle";
    oscilador.frequency.setValueAtTime(frequencia, inicio);

    ganho.gain.setValueAtTime(0.0001, inicio);
    ganho.gain.exponentialRampToValueAtTime(0.22, inicio + 0.04);
    ganho.gain.exponentialRampToValueAtTime(0.0001, inicio + duracao);

    oscilador.connect(ganho).connect(ctx.destination);
    oscilador.start(inicio);
    oscilador.stop(inicio + duracao + 0.05);
  });
}
