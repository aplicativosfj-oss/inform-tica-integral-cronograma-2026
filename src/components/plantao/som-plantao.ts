/**
 * Som do "Operação: Plantão", sintetizado na hora com WebAudio — nenhum
 * arquivo de áudio é baixado. Tem latido, pisadas, sirene, coleta e entrega,
 * alerta de tempo, fanfarras e uma música de fundo que muda com o clima.
 *
 * Duas lições do jogo de corrida valem aqui também: o alto-falante do celular
 * não toca graves (por isso tudo tem harmônicos agudos) e o navegador só libera
 * o áudio depois de um toque (por isso `criar()` roda dentro do clique em
 * "Jogar" e o jogo vigia o estado do contexto).
 */

import type { Clima } from "@/components/plantao/dados";

const CHAVE = "operacao-plantao:som";

const midiParaHz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

interface Tom {
  bpm: number;
  raiz: number;
  acordes: number[][];
}

const TONS: Record<Clima, Tom> = {
  dia: {
    bpm: 112,
    raiz: 45,
    acordes: [
      [57, 60, 64],
      [53, 57, 60],
      [55, 59, 62],
      [52, 55, 59],
    ],
  },
  "por-do-sol": {
    bpm: 96,
    raiz: 38,
    acordes: [
      [50, 53, 57],
      [46, 50, 53],
      [48, 52, 55],
      [45, 48, 52],
    ],
  },
  noite: {
    bpm: 90,
    raiz: 40,
    acordes: [
      [52, 55, 59],
      [48, 52, 55],
      [50, 54, 57],
      [47, 51, 54],
    ],
  },
};

export class SomPlantao {
  private ctx: AudioContext;
  private mestre: GainNode;
  private busMusica: GainNode;
  private busEfeitos: GainNode;
  private ruido: AudioBuffer;
  private medidor: AnalyserNode;
  private silencio: HTMLAudioElement | null = null;
  private timer: number | undefined;
  private proximoPasso = 0;
  private passo = 0;
  private clima: Clima = "dia";
  private ultimoPasso = 0;
  musicaLigada = true;
  efeitosLigados = true;

  private constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.mestre = ctx.createGain();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -20;
    comp.knee.value = 12;
    comp.ratio.value = 4;
    this.medidor = ctx.createAnalyser();
    this.medidor.fftSize = 512;
    this.mestre.connect(comp);
    comp.connect(this.medidor);
    comp.connect(ctx.destination);
    this.busMusica = ctx.createGain();
    this.busEfeitos = ctx.createGain();
    this.busMusica.connect(this.mestre);
    this.busEfeitos.connect(this.mestre);
    try {
      const salvo = JSON.parse(window.localStorage.getItem(CHAVE) ?? "{}") as {
        musica?: boolean;
        efeitos?: boolean;
      };
      this.musicaLigada = salvo.musica ?? true;
      this.efeitosLigados = salvo.efeitos ?? true;
    } catch {
      // Padrão: tudo ligado.
    }
    this.aplicar();
    this.ruido = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = this.ruido.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }

  static criar(): SomPlantao | null {
    try {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      const ctx = new Ctor();
      void ctx.resume();
      const som = new SomPlantao(ctx);
      // iPhone: o botão de silêncio muta o WebAudio, mas não um <audio> em loop.
      try {
        const wav = new Uint8Array(44 + 800);
        const dv = new DataView(wav.buffer);
        const txt = (o: number, t: string) =>
          [...t].forEach((c, i) => dv.setUint8(o + i, c.charCodeAt(0)));
        txt(0, "RIFF");
        dv.setUint32(4, 836, true);
        txt(8, "WAVEfmt ");
        dv.setUint32(16, 16, true);
        dv.setUint16(20, 1, true);
        dv.setUint16(22, 1, true);
        dv.setUint32(24, 8000, true);
        dv.setUint32(28, 8000, true);
        dv.setUint16(32, 1, true);
        dv.setUint16(34, 8, true);
        txt(36, "data");
        dv.setUint32(40, 800, true);
        wav.fill(128, 44);
        const audio = new Audio(URL.createObjectURL(new Blob([wav], { type: "audio/wav" })));
        audio.loop = true;
        audio.setAttribute("playsinline", "");
        void audio.play().catch(() => undefined);
        som.silencio = audio;
      } catch {
        // Sem <audio>: só WebAudio.
      }
      document.addEventListener("visibilitychange", () => {
        if (!document.hidden) som.retomar();
      });
      return som;
    } catch {
      return null;
    }
  }

  estado(): AudioContextState {
    return this.ctx.state;
  }

  retomar() {
    if (this.ctx.state !== "running") void this.ctx.resume();
  }

  pico(): number {
    const dados = new Uint8Array(this.medidor.fftSize);
    this.medidor.getByteTimeDomainData(dados);
    let max = 0;
    for (const v of dados) max = Math.max(max, Math.abs(v - 128));
    return max / 128;
  }

  private aplicar() {
    this.busMusica.gain.value = this.musicaLigada ? 0.3 : 0;
    this.busEfeitos.gain.value = this.efeitosLigados ? 0.95 : 0;
    try {
      window.localStorage.setItem(
        CHAVE,
        JSON.stringify({ musica: this.musicaLigada, efeitos: this.efeitosLigados }),
      );
    } catch {
      // Preferência não guardada.
    }
  }

  definir(musica: boolean, efeitos: boolean) {
    this.musicaLigada = musica;
    this.efeitosLigados = efeitos;
    this.aplicar();
  }

  alternarMusica(): boolean {
    this.musicaLigada = !this.musicaLigada;
    this.aplicar();
    return this.musicaLigada;
  }

  alternarEfeitos(): boolean {
    this.efeitosLigados = !this.efeitosLigados;
    this.aplicar();
    return this.efeitosLigados;
  }

  // ------------------------------------------------------------- efeitos

  private nota(f: number, dur: number, tipo: OscillatorType, vol: number, quando = 0, f2?: number) {
    const t = this.ctx.currentTime + quando;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = tipo;
    o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(this.busEfeitos);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  private chiado(
    dur: number,
    freq: number,
    q: number,
    vol: number,
    tipo: BiquadFilterType,
    quando = 0,
  ) {
    const t = this.ctx.currentTime + quando;
    const f = this.ctx.createBufferSource();
    f.buffer = this.ruido;
    const filtro = this.ctx.createBiquadFilter();
    filtro.type = tipo;
    filtro.frequency.value = freq;
    filtro.Q.value = q;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    f.connect(filtro);
    filtro.connect(g);
    g.connect(this.busEfeitos);
    f.start(t, Math.random());
    f.stop(t + dur + 0.02);
  }

  /** Pisada: chamada a cada passo do personagem. */
  passoTeto(correndo: boolean) {
    const agora = this.ctx.currentTime;
    if (agora - this.ultimoPasso < (correndo ? 0.16 : 0.26)) return;
    this.ultimoPasso = agora;
    this.chiado(0.07, correndo ? 1500 : 1000, 0.8, correndo ? 0.32 : 0.22, "bandpass");
    this.nota(correndo ? 190 : 140, 0.05, "triangle", 0.18);
  }

  /** Latido de cachorro: dois "au" com formante de voz. */
  latido(vezes = 2) {
    for (let i = 0; i < vezes; i++) {
      const q = i * 0.2;
      this.nota(520, 0.16, "sawtooth", 0.42, q, 300);
      this.nota(1040, 0.12, "square", 0.12, q, 620);
      this.chiado(0.12, 1200, 1.4, 0.2, "bandpass", q);
    }
  }

  pegar() {
    this.nota(660, 0.09, "triangle", 0.4);
    this.nota(990, 0.12, "triangle", 0.36, 0.08);
  }

  entregar() {
    [523, 659, 784, 1047].forEach((f, i) => this.nota(f, 0.16, "triangle", 0.38, i * 0.07));
  }

  capturar() {
    this.latido(1);
    [392, 523, 659, 784].forEach((f, i) => this.nota(f, 0.2, "square", 0.22, 0.12 + i * 0.08));
  }

  erro() {
    this.nota(220, 0.22, "sawtooth", 0.4, 0, 110);
    this.chiado(0.15, 700, 0.6, 0.25, "lowpass");
  }

  tique() {
    this.nota(1200, 0.05, "square", 0.22);
  }

  clique() {
    this.nota(880, 0.06, "square", 0.22);
  }

  cafe() {
    [600, 800, 1000, 1400].forEach((f, i) => this.nota(f, 0.09, "square", 0.24, i * 0.05));
  }

  /** Sirene de alerta: sobe e desce duas vezes. */
  sirene() {
    for (let i = 0; i < 2; i++) {
      this.nota(600, 0.32, "sawtooth", 0.34, i * 0.64, 950);
      this.nota(950, 0.32, "sawtooth", 0.34, i * 0.64 + 0.32, 600);
    }
  }

  pular() {
    this.nota(300, 0.18, "square", 0.22, 0, 700);
  }

  agua() {
    this.chiado(0.25, 2400, 0.7, 0.25, "highpass");
    this.nota(800, 0.16, "sine", 0.3, 0, 1300);
  }

  vitoria() {
    [523, 659, 784, 1047, 1319].forEach((f, i) => this.nota(f, 0.3, "triangle", 0.4, i * 0.13));
  }

  derrota() {
    [392, 330, 262, 196].forEach((f, i) => this.nota(f, 0.34, "sawtooth", 0.3, i * 0.2));
  }

  // -------------------------------------------------------------- música

  iniciarMusica(clima: Clima) {
    this.pararMusica();
    this.clima = clima;
    this.proximoPasso = this.ctx.currentTime + 0.1;
    this.passo = 0;
    const passoSeg = () => 60 / TONS[this.clima].bpm / 2;
    this.timer = window.setInterval(() => {
      while (this.proximoPasso < this.ctx.currentTime + 0.2) {
        this.agendar(this.passo, this.proximoPasso);
        this.proximoPasso += passoSeg();
        this.passo += 1;
      }
    }, 50);
  }

  pararMusica() {
    if (this.timer !== undefined) window.clearInterval(this.timer);
    this.timer = undefined;
  }

  private tocarM(
    f: number,
    t: number,
    dur: number,
    tipo: OscillatorType,
    vol: number,
    corte: number,
  ) {
    const o = this.ctx.createOscillator();
    const fl = this.ctx.createBiquadFilter();
    const g = this.ctx.createGain();
    o.type = tipo;
    o.frequency.setValueAtTime(f, t);
    fl.type = "lowpass";
    fl.frequency.setValueAtTime(corte, t);
    fl.frequency.exponentialRampToValueAtTime(Math.max(200, corte * 0.35), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(fl);
    fl.connect(g);
    g.connect(this.busMusica);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  private agendar(passo: number, t: number) {
    const tom = TONS[this.clima];
    const compasso = Math.floor(passo / 8) % tom.acordes.length;
    const acorde = tom.acordes[compasso]!;
    const p = passo % 8;
    const dur = 60 / tom.bpm / 2;
    // baixo pulsante (uma oitava acima para soar no celular) + dobra aguda
    const grave = acorde[0]! - 24 + 12;
    if (p % 2 === 0) {
      this.tocarM(midiParaHz(grave), t, dur * 1.6, "sawtooth", 0.5, 900);
      this.tocarM(midiParaHz(grave + 12), t, dur, "square", 0.1, 1800);
    }
    // arpejo tenso
    const nota = acorde[[0, 1, 2, 1, 2, 1, 0, 2][p]! % 3]! + 12;
    this.tocarM(midiParaHz(nota), t, dur * 0.9, "square", 0.13, 2600);
    // percussão: bumbo no tempo, chimbal no contratempo
    if (p === 0 || p === 4) {
      this.chiado(0.05, 1800, 1, 0.4, "bandpass");
      const tt = t;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.frequency.setValueAtTime(230, tt);
      o.frequency.exponentialRampToValueAtTime(55, tt + 0.13);
      g.gain.setValueAtTime(0.9, tt);
      g.gain.exponentialRampToValueAtTime(0.001, tt + 0.16);
      o.connect(g);
      g.connect(this.busMusica);
      o.start(tt);
      o.stop(tt + 0.18);
    }
    if (p % 2 === 1) {
      const f = this.ctx.createBufferSource();
      f.buffer = this.ruido;
      const hp = this.ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 7000;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.18, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
      f.connect(hp);
      hp.connect(g);
      g.connect(this.busMusica);
      f.start(t, Math.random());
      f.stop(t + 0.06);
    }
  }

  parar() {
    this.pararMusica();
    if (this.silencio) {
      this.silencio.pause();
      this.silencio = null;
    }
    void this.ctx.close();
  }
}
