/**
 * Som do jogo de corrida — tudo sintetizado na hora com WebAudio, sem baixar
 * nenhum arquivo: motor com troca de marchas, chiado de pneu na derrapagem e
 * na freada, cascalho fora da pista, batidas, bipes da largada, fanfarra de
 * chegada e uma música de fundo em loop.
 *
 * O contexto de áudio só pode nascer depois de um toque/clique (regra dos
 * navegadores); por isso `SomCorrida.criar()` é chamado dentro do clique em
 * "Largar". Se o navegador não tiver WebAudio, `criar()` devolve null e o jogo
 * segue mudo, sem erro.
 */

const CHAVE = "infoteca:corrida:som";

export interface EstadoSom {
  /** 0 a 1: velocidade em relação ao máximo. */
  razao: number;
  acelerando: boolean;
  freando: boolean;
  derrapando: boolean;
  foraDaPista: boolean;
  andando: boolean;
}

const midiParaHz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

// Progressão Am – F – C – G, 124 batidas por minuto.
const ACORDES = [
  { baixo: 33, notas: [57, 60, 64, 67] },
  { baixo: 29, notas: [53, 57, 60, 65] },
  { baixo: 36, notas: [55, 60, 64, 67] },
  { baixo: 31, notas: [55, 59, 62, 67] },
];
const BPM = 124;
const PASSO = 60 / BPM / 4;

export class SomCorrida {
  private ctx: AudioContext;
  private mestre: GainNode;
  private busMusica: GainNode;
  private busEfeitos: GainNode;
  private ruido: AudioBuffer;
  private medidor: AnalyserNode;
  private silencio: HTMLAudioElement | null = null;
  private motor: {
    o1: OscillatorNode;
    o2: OscillatorNode;
    o3: OscillatorNode;
    filtro: BiquadFilterNode;
    ganho: GainNode;
  };
  private pneu: { filtro: BiquadFilterNode; ganho: GainNode };
  private cascalho: { ganho: GainNode };
  private vento: { ganho: GainNode };
  private timer: number | undefined;
  private proximoPasso = 0;
  private passo = 0;
  musicaLigada = true;
  efeitosLigados = true;

  private constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.mestre = ctx.createGain();
    this.mestre.gain.value = 1;
    // Compressor: deixa o som alto e parelho sem estourar no alto-falante pequeno do celular.
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -20;
    compressor.knee.value = 12;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.2;
    this.medidor = ctx.createAnalyser();
    this.medidor.fftSize = 512;
    this.mestre.connect(compressor);
    compressor.connect(this.medidor);
    compressor.connect(ctx.destination);
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
      // Sem storage: usa o padrão (tudo ligado).
    }
    this.aplicarVolumes();

    // Ruído branco de 2 s, reaproveitado por todos os efeitos.
    this.ruido = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const dados = this.ruido.getChannelData(0);
    for (let i = 0; i < dados.length; i++) dados[i] = Math.random() * 2 - 1;

    // Motor: serra + quadrada uma oitava abaixo, filtradas.
    const o1 = ctx.createOscillator();
    const o2 = ctx.createOscillator();
    const o3 = ctx.createOscillator();
    o1.type = "sawtooth";
    o2.type = "square";
    o3.type = "sawtooth";
    // Distorção leve: gera harmônicos que aparecem até no alto-falante do celular.
    const distorce = ctx.createWaveShaper();
    const curva = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i / 255) * 2 - 1;
      curva[i] = Math.tanh(x * 3.2);
    }
    distorce.curve = curva;
    const filtro = ctx.createBiquadFilter();
    filtro.type = "lowpass";
    filtro.frequency.value = 900;
    const graves = ctx.createBiquadFilter();
    graves.type = "peaking";
    graves.frequency.value = 420;
    graves.gain.value = 9;
    const ganho = ctx.createGain();
    ganho.gain.value = 0;
    const g1 = ctx.createGain();
    const g3 = ctx.createGain();
    g1.gain.value = 0.6;
    g3.gain.value = 0.5;
    o1.connect(g1);
    o3.connect(g3);
    g1.connect(distorce);
    g3.connect(distorce);
    o2.connect(distorce);
    distorce.connect(filtro);
    filtro.connect(graves);
    graves.connect(ganho);
    ganho.connect(this.busEfeitos);
    o1.start();
    o2.start();
    o3.start();
    this.motor = { o1, o2, o3, filtro, ganho };

    // Chiado de pneu
    this.pneu = this.criarRuido(1900, 1.4, "bandpass");
    this.cascalho = { ganho: this.criarRuido(420, 0.7, "lowpass").ganho };
    this.vento = { ganho: this.criarRuido(2600, 0.5, "highpass").ganho };
  }

  static criar(): SomCorrida | null {
    try {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      const ctx = new Ctor();
      void ctx.resume();
      const som = new SomCorrida(ctx);
      // iPhone: o interruptor de silêncio muta o WebAudio, mas não um <audio>. Tocar um
      // <audio> mudo em loop coloca a página na "categoria de reprodução" e libera o som.
      try {
        const wav = new Uint8Array(44 + 800);
        const dv = new DataView(wav.buffer);
        const txt = (o: number, t: string) =>
          [...t].forEach((c, i) => dv.setUint8(o + i, c.charCodeAt(0)));
        txt(0, "RIFF");
        dv.setUint32(4, 36 + 800, true);
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
        // Sem <audio>: segue só com WebAudio.
      }
      // Truque do iOS/Android: tocar um instante de silêncio dentro do toque libera o áudio.
      const mudo = ctx.createBuffer(1, 1, 22050);
      const fonte = ctx.createBufferSource();
      fonte.buffer = mudo;
      fonte.connect(ctx.destination);
      fonte.start(0);
      // Se a aba for escondida e voltar, o navegador suspende o áudio: retoma.
      document.addEventListener("visibilitychange", () => {
        if (!document.hidden) som.retomar();
      });
      return som;
    } catch {
      return null;
    }
  }

  /** Estado do áudio do navegador: "running" quando está tocando de verdade. */
  estado(): AudioContextState {
    return this.ctx.state;
  }

  /** Reativa o áudio depois de um toque (chamado a cada toque na tela do jogo). */
  retomar() {
    if (this.ctx.state !== "running") void this.ctx.resume();
  }

  private criarRuido(freq: number, q: number, tipo: BiquadFilterType) {
    const fonte = this.ctx.createBufferSource();
    fonte.buffer = this.ruido;
    fonte.loop = true;
    const filtro = this.ctx.createBiquadFilter();
    filtro.type = tipo;
    filtro.frequency.value = freq;
    filtro.Q.value = q;
    const ganho = this.ctx.createGain();
    ganho.gain.value = 0;
    fonte.connect(filtro);
    filtro.connect(ganho);
    ganho.connect(this.busEfeitos);
    fonte.start();
    return { filtro, ganho };
  }

  private aplicarVolumes() {
    this.busMusica.gain.value = this.musicaLigada ? 0.34 : 0;
    this.busEfeitos.gain.value = this.efeitosLigados ? 0.95 : 0;
    try {
      window.localStorage.setItem(
        CHAVE,
        JSON.stringify({ musica: this.musicaLigada, efeitos: this.efeitosLigados }),
      );
    } catch {
      // Preferência não guardada: vale só nesta partida.
    }
  }

  alternarMusica(): boolean {
    this.musicaLigada = !this.musicaLigada;
    this.aplicarVolumes();
    return this.musicaLigada;
  }

  alternarEfeitos(): boolean {
    this.efeitosLigados = !this.efeitosLigados;
    this.aplicarVolumes();
    return this.efeitosLigados;
  }

  // ------------------------------------------------------ som contínuo

  /** Chamado a cada quadro: ajusta motor, pneu, cascalho e vento. */
  atualizar(e: EstadoSom) {
    const t = this.ctx.currentTime;
    const marcha = Math.min(4, Math.floor(e.razao * 5));
    const rpm = e.razao * 5 - marcha;
    const freq = e.andando ? 48 + rpm * 120 + marcha * 26 + e.razao * 40 : 42;
    this.motor.o1.frequency.setTargetAtTime(freq, t, 0.05);
    this.motor.o2.frequency.setTargetAtTime(freq / 2, t, 0.05);
    // Terceira voz duas oitavas acima: é ela que o alto-falante do celular realmente toca.
    this.motor.o3.frequency.setTargetAtTime(freq * 3, t, 0.05);
    this.motor.filtro.frequency.setTargetAtTime(
      380 + e.razao * 1500 + (e.acelerando ? 500 : 0),
      t,
      0.08,
    );
    this.motor.ganho.gain.setTargetAtTime(
      e.andando ? 0.32 + (e.acelerando ? 0.16 : 0) + e.razao * 0.1 : 0.14,
      t,
      0.08,
    );
    const derrapa = e.derrapando ? 0.4 : 0;
    this.pneu.ganho.gain.setTargetAtTime(derrapa, t, 0.04);
    this.pneu.filtro.frequency.setTargetAtTime(1500 + e.razao * 900, t, 0.1);
    this.cascalho.ganho.gain.setTargetAtTime(e.foraDaPista ? 0.18 * (0.3 + e.razao) : 0, t, 0.05);
    this.vento.ganho.gain.setTargetAtTime(e.razao * e.razao * 0.07, t, 0.15);
  }

  // ----------------------------------------------------------- efeitos

  private nota(freq: number, dur: number, tipo: OscillatorType, vol: number, quando = 0) {
    const t = this.ctx.currentTime + quando;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = tipo;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(this.busEfeitos);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  /** Bipe da contagem: agudo na largada. */
  bipe(largada: boolean) {
    this.nota(largada ? 880 : 440, largada ? 0.55 : 0.18, "square", 0.25);
  }

  /** Faixa de turbo: varredura ascendente com chiado. */
  turbo() {
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(260, t);
    o.frequency.exponentialRampToValueAtTime(1500, t + 0.5);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.45, t + 0.08);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
    o.connect(g);
    g.connect(this.busEfeitos);
    o.start(t);
    o.stop(t + 0.75);
  }

  /** Intensidade atual da saída (0 a 1): serve para conferir que há som de verdade. */
  pico(): number {
    const dados = new Uint8Array(this.medidor.fftSize);
    this.medidor.getByteTimeDomainData(dados);
    let max = 0;
    for (const d of dados) max = Math.max(max, Math.abs(d - 128));
    return max / 128;
  }

  batida() {
    const t = this.ctx.currentTime;
    const fonte = this.ctx.createBufferSource();
    fonte.buffer = this.ruido;
    const f = this.ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = 1100;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.7, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    fonte.connect(f);
    f.connect(g);
    g.connect(this.busEfeitos);
    fonte.start(t);
    fonte.stop(t + 0.3);
    const o = this.ctx.createOscillator();
    const og = this.ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(140, t);
    o.frequency.exponentialRampToValueAtTime(40, t + 0.25);
    og.gain.setValueAtTime(0.8, t);
    og.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    o.connect(og);
    og.connect(this.busEfeitos);
    o.start(t);
    o.stop(t + 0.35);
  }

  /** Fanfarra na chegada; para quem não subiu ao pódio, um tom mais brando. */
  fim(podio: boolean) {
    const notas = podio ? [60, 64, 67, 72, 76, 79] : [67, 64, 62, 60];
    notas.forEach((m, i) =>
      this.nota(midiParaHz(m), 0.32, podio ? "triangle" : "sine", 0.3, i * 0.14),
    );
  }

  // ------------------------------------------------------------ música

  iniciarMusica() {
    if (this.timer !== undefined) return;
    this.proximoPasso = this.ctx.currentTime + 0.1;
    this.passo = 0;
    this.timer = window.setInterval(() => {
      while (this.proximoPasso < this.ctx.currentTime + 0.2) {
        this.agendarPasso(this.passo, this.proximoPasso);
        this.proximoPasso += PASSO;
        this.passo += 1;
      }
    }, 50);
  }

  private tocarMusica(
    freq: number,
    t: number,
    dur: number,
    tipo: OscillatorType,
    vol: number,
    corte: number,
  ) {
    const o = this.ctx.createOscillator();
    const f = this.ctx.createBiquadFilter();
    const g = this.ctx.createGain();
    o.type = tipo;
    o.frequency.setValueAtTime(freq, t);
    f.type = "lowpass";
    f.frequency.setValueAtTime(corte, t);
    f.frequency.exponentialRampToValueAtTime(Math.max(120, corte * 0.3), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(f);
    f.connect(g);
    g.connect(this.busMusica);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  private percussao(t: number, tipo: "bumbo" | "caixa" | "chimbal") {
    if (tipo === "bumbo") {
      // estalo curto e agudo no começo: é o que se ouve no celular
      const clique = this.ctx.createBufferSource();
      clique.buffer = this.ruido;
      const fc = this.ctx.createBiquadFilter();
      fc.type = "bandpass";
      fc.frequency.value = 1800;
      const gc = this.ctx.createGain();
      gc.gain.setValueAtTime(0.5, t);
      gc.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
      clique.connect(fc);
      fc.connect(gc);
      gc.connect(this.busMusica);
      clique.start(t, Math.random());
      clique.stop(t + 0.04);
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.frequency.setValueAtTime(240, t);
      o.frequency.exponentialRampToValueAtTime(55, t + 0.14);
      g.gain.setValueAtTime(1, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      o.connect(g);
      g.connect(this.busMusica);
      o.start(t);
      o.stop(t + 0.2);
      return;
    }
    const fonte = this.ctx.createBufferSource();
    fonte.buffer = this.ruido;
    const f = this.ctx.createBiquadFilter();
    f.type = "highpass";
    f.frequency.value = tipo === "caixa" ? 1400 : 7000;
    const g = this.ctx.createGain();
    const dur = tipo === "caixa" ? 0.14 : 0.04;
    g.gain.setValueAtTime(tipo === "caixa" ? 0.55 : 0.22, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    fonte.connect(f);
    f.connect(g);
    g.connect(this.busMusica);
    fonte.start(t, Math.random());
    fonte.stop(t + dur + 0.02);
  }

  private agendarPasso(passo: number, t: number) {
    const compasso = Math.floor(passo / 16) % ACORDES.length;
    const acorde = ACORDES[compasso]!;
    const p = passo % 16;
    if (p % 4 === 0) this.percussao(t, "bumbo");
    if (p === 4 || p === 12) this.percussao(t, "caixa");
    if (p % 2 === 1) this.percussao(t, "chimbal");
    // baixo em colcheias, com oitava no contratempo
    if (p % 2 === 0) {
      const oitava = p % 4 === 2 ? 12 : 0;
      this.tocarMusica(
        midiParaHz(acorde.baixo + 12 + oitava),
        t,
        PASSO * 1.8,
        "sawtooth",
        0.55,
        900,
      );
      this.tocarMusica(
        midiParaHz(acorde.baixo + 24 + oitava),
        t,
        PASSO * 1.2,
        "square",
        0.12,
        1800,
      );
    }
    // arpejo do sintetizador
    const ordem = [0, 1, 2, 3, 2, 1, 2, 3];
    if (p % 2 === 0) {
      const nota = acorde.notas[ordem[(p / 2) % 8]!]!;
      this.tocarMusica(midiParaHz(nota + 12), t, PASSO * 1.6, "square", 0.16, 2600);
    }
  }

  parar() {
    if (this.timer !== undefined) window.clearInterval(this.timer);
    this.timer = undefined;
    try {
      this.motor.o1.stop();
      this.motor.o2.stop();
    } catch {
      // Já parado.
    }
    if (this.silencio) {
      this.silencio.pause();
      this.silencio = null;
    }
    void this.ctx.close();
  }
}
