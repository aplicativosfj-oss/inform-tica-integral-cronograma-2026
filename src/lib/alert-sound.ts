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
