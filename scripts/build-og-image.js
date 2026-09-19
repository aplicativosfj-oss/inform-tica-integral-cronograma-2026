/**
 * Gera as duas artes de compartilhamento:
 *
 * - public/og-thumb.jpg (600x600), usada como og:image. É quadrada de
 *   propósito: com ela WhatsApp, X e LinkedIn montam o card compacto, com a
 *   miniatura ao lado do texto, em vez do banner que ocupa a conversa
 *   inteira. Por aparecer pequena (~100px), carrega só a marca — foto de
 *   turma nesse tamanho vira borrão.
 * - public/og-image.jpg (1200x630), a arte panorâmica. Não é mais o card
 *   social; fica para o sitemap de imagens, onde tamanho grande ajuda.
 *
 * Rode com: node scripts/build-og-image.js
 */
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const L = 1200;
const A = 630;
/** Onde a foto começa. O degradê do painel morre um pouco depois, sobrepondo. */
const FOTO_X = 600;

const FONTE = "Segoe UI, Tahoma, DejaVu Sans, Arial, sans-serif";

/** Foto: recorta a faixa com a aluna sorrindo e preenche a metade direita. */
async function fotoDireita() {
  const origem = resolve(raiz, "src/assets/alunos-hero.jpg");
  const { width, height } = await sharp(origem).metadata();
  // A aluna está por volta de 60% da largura; centramos o recorte nela.
  const larguraRecorte = Math.round((height * (L - FOTO_X)) / A);
  const esquerda = Math.min(
    Math.max(Math.round(width * 0.6 - larguraRecorte / 2), 0),
    width - larguraRecorte,
  );
  return sharp(origem)
    .extract({ left: esquerda, top: 0, width: larguraRecorte, height })
    .resize(L - FOTO_X, A, { fit: "cover" })
    .modulate({ brightness: 1.04, saturation: 1.06 })
    .toBuffer();
}

const painelSvg = `
<svg width="${L}" height="${A}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="painel" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1e3a8a"/>
      <stop offset="55%" stop-color="#1d4ed8"/>
      <stop offset="100%" stop-color="#2563eb"/>
    </linearGradient>
    <!-- Borda suave: o painel dissolve sobre a foto, sem corte reto. -->
    <linearGradient id="fade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#1d4ed8" stop-opacity="1"/>
      <stop offset="100%" stop-color="#1d4ed8" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="brilho" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#60a5fa" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#60a5fa" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <!-- Sem retângulo de fundo inteiro: a foto já está na base e seria coberta. -->
  <rect width="${FOTO_X}" height="${A}" fill="url(#painel)"/>
  <circle cx="90" cy="70" r="240" fill="url(#brilho)"/>
  <rect x="${FOTO_X}" y="0" width="150" height="${A}" fill="url(#fade)"/>

  <!-- Faixa âmbar da identidade impressa da escola -->
  <rect x="0" y="0" width="10" height="${A}" fill="#fbbf24"/>

  <!-- Cartão branco sob a logo: a marca é azul-escura e sumiria no painel. -->
  <rect x="60" y="52" width="288" height="120" rx="18" fill="#ffffff"/>

  <g font-family="${FONTE}">
    <rect x="72" y="198" width="196" height="40" rx="20" fill="#bfdbfe" fill-opacity="0.22"/>
    <text x="96" y="225" font-size="19" font-weight="600" fill="#dbeafe" letter-spacing="2.2">AGENDA ONLINE</text>

    <text x="72" y="310" font-size="63" font-weight="700" fill="#ffffff">Informática na</text>
    <text x="72" y="382" font-size="63" font-weight="700" fill="#93c5fd">Escola</text>

    <text x="72" y="440" font-size="24" fill="#dbeafe" fill-opacity="0.92">Cronograma automático, revezamento justo</text>
    <text x="72" y="474" font-size="24" fill="#dbeafe" fill-opacity="0.92">e cronômetro ao vivo no laboratório de TI.</text>

    <rect x="72" y="524" width="52" height="4" rx="2" fill="#fbbf24"/>
    <text x="72" y="566" font-size="20" font-weight="600" fill="#bfdbfe">Escola Municipal em Tempo Integral</text>
    <text x="72" y="592" font-size="20" font-weight="600" fill="#bfdbfe">Dr. Eiraldo Carneiro de França</text>
  </g>
</svg>`;

const logo = await sharp(resolve(raiz, "src/assets/logo-full-transparent.png"))
  .resize({ width: 260 })
  .toBuffer();

await sharp({ create: { width: L, height: A, channels: 3, background: "#0f172a" } })
  .composite([
    { input: await fotoDireita(), left: FOTO_X, top: 0 },
    { input: Buffer.from(painelSvg), left: 0, top: 0 },
    { input: logo, left: 72, top: 64 },
  ])
  .jpeg({ quality: 88, chromaSubsampling: "4:4:4" })
  .toFile(resolve(raiz, "public/og-image.jpg"));

console.log("public/og-image.jpg gerado com sucesso.");

/* ---------- miniatura quadrada (o card social de verdade) ----------
 * Antes era um retângulo azul chapado com a logo flutuando no meio — sem
 * nada que lembrasse a escola de verdade. Agora é a mesma foto do banner
 * grande (recorte quadrado, centrado na aluna), com um degradê só na base
 * para o texto ficar legível — compacta, mas com cara de gente de verdade,
 * não de peça de marketing genérica. */
const Q = 600;

/** Recorte quadrado da mesma foto do banner, centrado na aluna. */
async function fotoQuadrada() {
  const origem = resolve(raiz, "src/assets/alunos-hero.jpg");
  const { width, height } = await sharp(origem).metadata();
  const lado = height;
  const esquerda = Math.min(Math.max(Math.round(width * 0.62 - lado / 2), 0), width - lado);
  return sharp(origem)
    .extract({ left: esquerda, top: 0, width: lado, height: lado })
    .resize(Q, Q, { fit: "cover" })
    .modulate({ brightness: 1.03, saturation: 1.05 })
    .toBuffer();
}

const miniaturaSvg = `
<svg width="${Q}" height="${Q}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Só a base escurece, para o texto não brigar com a foto. -->
    <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0b1e4d" stop-opacity="0"/>
      <stop offset="46%" stop-color="#0b1e4d" stop-opacity="0"/>
      <stop offset="78%" stop-color="#0b1e4d" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#0b1e4d" stop-opacity="0.92"/>
    </linearGradient>
  </defs>

  <rect width="${Q}" height="${Q}" fill="url(#fade)"/>
  <rect x="0" y="${Q - 6}" width="${Q}" height="6" fill="#fbbf24"/>

  <!-- Selo branco discreto por trás do ícone: a marca é escura e sumiria na foto. -->
  <rect x="28" y="28" width="64" height="64" rx="16" fill="#ffffff" fill-opacity="0.96"/>

  <g font-family="${FONTE}">
    <text x="32" y="486" font-size="34" font-weight="700" fill="#ffffff">Agenda de Informática</text>
    <text x="32" y="518" font-size="19" font-weight="600" fill="#bfdbfe">Escola Dr. Eiraldo Carneiro</text>
  </g>
</svg>`;

const iconeMiniatura = await sharp(resolve(raiz, "src/assets/logo-icon.png"))
  .resize({ width: 44 })
  .toBuffer();

await sharp({ create: { width: Q, height: Q, channels: 3, background: "#1d4ed8" } })
  .composite([
    { input: await fotoQuadrada(), left: 0, top: 0 },
    { input: Buffer.from(miniaturaSvg), left: 0, top: 0 },
    { input: iconeMiniatura, left: 38, top: 38 },
  ])
  .jpeg({ quality: 90, chromaSubsampling: "4:4:4" })
  .toFile(resolve(raiz, "public/og-thumb.jpg"));

console.log("public/og-thumb.jpg gerado com sucesso.");
