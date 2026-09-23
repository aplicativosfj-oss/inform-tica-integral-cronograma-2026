/**
 * Gera uma imagem de compartilhamento (1200x630) para cada jogo, cada
 * ferramenta e cada seção do site — assim, quando alguém manda um link no
 * WhatsApp, o cartão mostra aquele jogo ou atividade, e não a arte genérica
 * da página inicial.
 *
 * Saída: public/og/<tipo>-<id>.jpg
 *   jogo-corrida.jpg, ferramenta-parque-letras.jpg, secao-infoteca.jpg …
 *
 * Como funciona: painel azul/colorido à esquerda com a marca da escola, o
 * título e a descrição; à direita, a arte do item — foto (jogos com arte
 * pronta), desenho vetorial (jogos de mesa) ou o ícone da ferramenta.
 * Os dados das ferramentas são lidos do próprio registro, então uma
 * ferramenta nova ganha cartão só de rodar o script de novo.
 *
 * Rode com: node scripts/build-share-images.mjs
 */
import sharp from "sharp";
import { readFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const saida = resolve(raiz, "public/og");
mkdirSync(saida, { recursive: true });

const W = 1200;
const H = 630;
const FONTE = "Segoe UI, Tahoma, DejaVu Sans, Arial, sans-serif";
const esc = (t) =>
  t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Quebra o texto em linhas de no máximo `max` caracteres. */
function quebrar(texto, max, linhas) {
  const palavras = texto.split(/\s+/);
  const out = [];
  let atual = "";
  for (const p of palavras) {
    if ((atual + " " + p).trim().length > max && atual) {
      out.push(atual);
      atual = p;
    } else atual = (atual + " " + p).trim();
  }
  if (atual) out.push(atual);
  if (out.length > linhas) {
    const cortado = out.slice(0, linhas);
    cortado[linhas - 1] = cortado[linhas - 1].replace(/[\s,.;:]+$/, "") + "…";
    return cortado;
  }
  return out;
}

// ------------------------------------------------------------- categorias

const CATEGORIAS = {
  "Matemática": ["#1e3a8a", "#2563eb", "MATEMÁTICA"],
  "Alfabetização e Leitura": ["#9d174d", "#db2777", "ALFABETIZAÇÃO E LEITURA"],
  "Ferramentas": ["#065f46", "#10b981", "FERRAMENTAS"],
  "Nossa região": ["#9a3412", "#f97316", "NOSSA REGIÃO"],
  "Recomposição": ["#5b21b6", "#8b5cf6", "RECOMPOSIÇÃO"],
  "Jogos": ["#0f172a", "#334155", "JOGO"],
  "Site": ["#1e3a8a", "#2563eb", "AGENDA DE INFORMÁTICA"],
};

// ------------------------------------------------------------ ícones lucide

function kebab(nome) {
  return nome
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([a-zA-Z])(\d)/g, "$1-$2")
    .toLowerCase();
}

function noIcone(nome) {
  const base = kebab(nome);
  const candidatos = [base, base.replace(/-icon$/, ""), base.replace(/-\d+$/, ""), base.replace(/x/, "x")];
  for (const c of candidatos) {
    const arq = resolve(raiz, `node_modules/lucide-react/dist/esm/icons/${c}.js`);
    if (existsSync(arq)) {
      const src = readFileSync(arq, "utf8");
      const m = src.match(/const __iconNode = (\[[\s\S]*?\]);\n/);
      if (m) return new Function(`return ${m[1]}`)();
    }
  }
  return noIcone("Shapes");
}

/** Converte os nós do lucide num grupo SVG (viewBox 24x24). */
function iconeSvg(nome, cor = "#ffffff", largura = 1.6) {
  const nos = noIcone(nome);
  const filhos = nos
    .map(([tag, attrs]) => {
      const a = Object.entries(attrs)
        .filter(([k]) => k !== "key")
        .map(([k, v]) => `${k}="${v}"`)
        .join(" ");
      return `<${tag} ${a}/>`;
    })
    .join("");
  return `<g fill="none" stroke="${cor}" stroke-width="${largura}" stroke-linecap="round" stroke-linejoin="round">${filhos}</g>`;
}

// ---------------------------------------------------------------- desenhos

const arteVelha = `
<svg width="520" height="500" viewBox="0 0 520 500" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="x" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#60a5fa"/><stop offset="1" stop-color="#1d4ed8"/></linearGradient>
    <linearGradient id="o" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fda4af"/><stop offset="1" stop-color="#e11d48"/></linearGradient>
    <filter id="s"><feDropShadow dx="0" dy="6" stdDeviation="6" flood-opacity="0.35"/></filter>
  </defs>
  <rect x="20" y="20" width="480" height="460" rx="36" fill="#f8fafc" filter="url(#s)"/>
  <g stroke="#cbd5e1" stroke-width="10" stroke-linecap="round"><path d="M180 60V440M340 60V440M60 170H460M60 330H460"/></g>
  <g stroke="url(#x)" stroke-width="26" stroke-linecap="round" filter="url(#s)">
    <path d="M80 80L150 150M150 80L80 150"/><path d="M240 240L310 310M310 240L240 310"/><path d="M370 350L440 420M440 350L370 420"/>
  </g>
  <g fill="none" stroke="url(#o)" stroke-width="26" filter="url(#s)">
    <circle cx="260" cy="115" r="38"/><circle cx="115" cy="275" r="38"/><circle cx="405" cy="115" r="38"/>
  </g>
  <path d="M60 60L460 440" stroke="#22c55e" stroke-width="0" />
</svg>`;

function pecaDama(cx, cy, claro, coroa) {
  return `<g filter="url(#s)"><circle cx="${cx}" cy="${cy + 5}" r="28" fill="${claro ? "#a8a29e" : "#000"}" opacity=".5"/>
  <circle cx="${cx}" cy="${cy}" r="28" fill="url(#${claro ? "pb" : "pp"})"/>
  <circle cx="${cx}" cy="${cy}" r="20" fill="none" stroke="${claro ? "#d6d3d1" : "#52525b"}" stroke-width="3"/>
  ${coroa ? `<path d="M${cx - 12} ${cy + 6} l4 -14 l8 8 l8 -8 l4 14z" fill="#f59e0b"/>` : ""}</g>`;
}
const arteDamas = (() => {
  let casas = "";
  for (let l = 0; l < 6; l++)
    for (let c = 0; c < 6; c++)
      casas += `<rect x="${40 + c * 73}" y="${30 + l * 73}" width="73" height="73" fill="${(l + c) % 2 ? "#8a5a34" : "#ecd9b8"}"/>`;
  const p = [
    [1, 0, 0], [3, 0, 0], [5, 0, 0], [0, 1, 0], [2, 1, 0], [4, 1, 0],
    [1, 4, 1], [3, 4, 1], [5, 4, 1], [0, 5, 1], [2, 5, 1, true], [4, 5, 1],
  ]
    .map(([c, l, claro, coroa]) => pecaDama(40 + c * 73 + 36, 30 + l * 73 + 36, claro === 1, coroa))
    .join("");
  return `<svg width="520" height="500" viewBox="0 0 520 500" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="pb" cx=".35" cy=".3"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#d6d3d1"/></radialGradient>
    <radialGradient id="pp" cx=".35" cy=".3"><stop offset="0" stop-color="#57534e"/><stop offset="1" stop-color="#0c0a09"/></radialGradient>
    <filter id="s"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity="0.4"/></filter>
  </defs>
  <rect x="24" y="14" width="472" height="470" rx="16" fill="#5b3a24" filter="url(#s)"/>
  <g>${casas}</g>${p}</svg>`;
})();

function pedra(x, y, giro, a, b) {
  const pip = (cx, cy) => `<circle cx="${cx}" cy="${cy}" r="9" fill="#0f172a"/>`;
  const faces = {
    1: [[0, 0]], 2: [[-14, -14], [14, 14]], 3: [[-16, -16], [0, 0], [16, 16]],
    4: [[-14, -14], [14, -14], [-14, 14], [14, 14]], 5: [[-16, -16], [16, -16], [0, 0], [-16, 16], [16, 16]],
    6: [[-14, -18], [14, -18], [-14, 0], [14, 0], [-14, 18], [14, 18]], 0: [],
  };
  const meia = (n, oy) => (faces[n] ?? []).map(([dx, dy]) => pip(dx, oy + dy)).join("");
  return `<g transform="translate(${x} ${y}) rotate(${giro})" filter="url(#s)">
    <rect x="-60" y="-110" width="120" height="220" rx="18" fill="url(#m)"/>
    <path d="M-50 0H50" stroke="#94a3b8" stroke-width="4"/>
    ${meia(a, -55)}${meia(b, 55)}</g>`;
}
const arteDomino = `
<svg width="520" height="500" viewBox="0 0 520 500" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="m" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e2e8f0"/></linearGradient>
    <filter id="s"><feDropShadow dx="0" dy="8" stdDeviation="8" flood-opacity="0.45"/></filter>
  </defs>
  ${pedra(140, 260, -22, 6, 3)}${pedra(270, 250, 8, 3, 5)}${pedra(400, 265, 30, 5, 1)}
</svg>`;

function cartaMemoria(x, y, virada, cor, forma) {
  if (!virada)
    return `<g transform="translate(${x} ${y})" filter="url(#s)"><rect width="130" height="150" rx="16" fill="#1e3a8a"/><rect x="10" y="10" width="110" height="130" rx="10" fill="none" stroke="#93c5fd" stroke-width="3"/><circle cx="65" cy="75" r="22" fill="#3b82f6"/><path d="M65 60l6 12 13 2-9 9 2 13-12-6-12 6 2-13-9-9 13-2z" fill="#fde047"/></g>`;
  return `<g transform="translate(${x} ${y})" filter="url(#s)"><rect width="130" height="150" rx="16" fill="#fff"/>${forma(cor)}</g>`;
}
const arteMemoria = `
<svg width="520" height="500" viewBox="0 0 520 500" xmlns="http://www.w3.org/2000/svg">
  <defs><filter id="s"><feDropShadow dx="0" dy="6" stdDeviation="6" flood-opacity="0.4"/></filter></defs>
  ${cartaMemoria(40, 40, true, "#ef4444", (c) => `<circle cx="65" cy="75" r="36" fill="${c}"/>`)}
  ${cartaMemoria(195, 40, false)}
  ${cartaMemoria(350, 40, true, "#22c55e", (c) => `<path d="M65 36L100 112H30z" fill="${c}"/>`)}
  ${cartaMemoria(40, 240, false)}
  ${cartaMemoria(195, 240, true, "#3b82f6", (c) => `<rect x="30" y="40" width="70" height="70" rx="10" fill="${c}"/>`)}
  ${cartaMemoria(350, 240, true, "#ef4444", (c) => `<circle cx="65" cy="75" r="36" fill="${c}"/>`)}
</svg>`;

const arteQuebra = (() => {
  const cores = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899"];
  let t = "";
  for (let i = 0; i < 9; i++) {
    if (i === 8) continue;
    const l = Math.floor(i / 3);
    const c = i % 3;
    t += `<g filter="url(#s)"><rect x="${50 + c * 142}" y="${40 + l * 142}" width="130" height="130" rx="18" fill="${cores[i]}"/>
    <text x="${115 + c * 142}" y="${125 + l * 142}" font-family="${FONTE}" font-size="64" font-weight="800" fill="#fff" text-anchor="middle">${i + 1}</text></g>`;
  }
  return `<svg width="520" height="500" viewBox="0 0 520 500" xmlns="http://www.w3.org/2000/svg">
  <defs><filter id="s"><feDropShadow dx="0" dy="5" stdDeviation="5" flood-opacity="0.35"/></filter></defs>
  <rect x="30" y="20" width="470" height="470" rx="28" fill="#0f172a" opacity=".55"/>${t}</svg>`;
})();

// -------------------------------------------------------------------- dados

const JOGOS = [
  { id: "corrida", nome: "Jogo de Corrida", sub: "Três voltas, cinco pistas, obstáculos, turbo, som e música. Dá para jogar no celular!", cores: ["#7f1d1d", "#dc2626"], foto: "public/images/jogos/cenario-deserto.jpg", selo: "Sala de Jogos" },
  { id: "digitacao", nome: "Escola de Digitação", sub: "Tutor, lições e fases para cada ano, com desafio contra o robô. Aprenda a digitar brincando!", cores: ["#0c4a6e", "#0284c7"], foto: "public/images/jogos/digitacao-capa.jpg", selo: "Sala de Jogos" },
  { id: "tabuleiro-matematica", nome: "Matemática em Ação", sub: "Jogo de tabuleiro com dado e cartas de conta, desafio e pense rápido.", cores: ["#1e3a8a", "#2563eb"], foto: "public/images/jogos/matematica-tabuleiro.png", selo: "Sala de Jogos" },
  { id: "damas", nome: "Jogo de Damas", sub: "Tabuleiro 8×8, captura obrigatória e coroação. Contra o computador ou um colega.", cores: ["#78350f", "#b45309"], arte: arteDamas, selo: "Sala de Jogos" },
  { id: "domino", nome: "Dominó", sub: "As 28 pedras, com compra no monte e jogo trancado. Arraste a pedra até a ponta!", cores: ["#14532d", "#16a34a"], arte: arteDomino, selo: "Sala de Jogos" },
  { id: "jogo-da-velha", nome: "Jogo da Velha", sub: "Três em linha. No difícil, o computador não perde nunca.", cores: ["#4c1d95", "#7c3aed"], arte: arteVelha, selo: "Sala de Jogos" },
  { id: "memoria", nome: "Jogo da Memória", sub: "Ache os pares com as figuras do Parque das Letras. Cada carta virada fala a palavra.", cores: ["#9d174d", "#db2777"], arte: arteMemoria, selo: "Sala de Jogos" },
  { id: "quebra-cabeca", nome: "Quebra-cabeça", sub: "Arraste as peças até a figura aparecer inteira.", cores: ["#0f766e", "#14b8a6"], arte: arteQuebra, selo: "Sala de Jogos" },
];

const SECOES = [
  { id: "infoteca", nome: "Infoteca", sub: "Espaço lúdico e de apoio pedagógico digital: jogos e ferramentas educativas para alunos, professores e famílias.", icone: "Library" },
  { id: "ferramentas", nome: "Ferramentas abertas", sub: "Ferramentas educativas de acesso livre: matemática, leitura, jogos e muito mais.", icone: "Wrench" },
  { id: "sobre", nome: "Sobre o projeto", sub: "Conheça a Agenda de Informática e o professor que a criou.", icone: "Info" },
  { id: "agenda", nome: "Agenda de aulas", sub: "Cronograma das aulas de informática por turma, dia e horário.", icone: "CalendarDays" },
  { id: "evolucao", nome: "Evolução dos alunos", sub: "Acompanhe o avanço de cada turma e de cada aluno.", icone: "TrendingUp" },
  { id: "descritores", nome: "Descritores de aprendizagem", sub: "Matriz de descritores para planejar e acompanhar a aprendizagem.", icone: "Target" },
  { id: "avaliacao", nome: "Avaliação diagnóstica", sub: "Avaliação para conhecer o que cada aluno já sabe e onde precisa avançar.", icone: "ClipboardCheck" },
  { id: "coordenacao", nome: "Coordenação", sub: "Visão da coordenação: turmas, frequência e indicadores.", icone: "Users" },
  { id: "tv", nome: "Painel da TV", sub: "A aula ao vivo, com cronômetro e grupos, para exibir na televisão do laboratório.", icone: "Tv" },
];

/** Lê as ferramentas do registro (slug, título, descrição, categoria e ícone). */
function lerFerramentas() {
  const src = readFileSync(resolve(raiz, "src/components/school/ferramentas/registro.tsx"), "utf8");
  const blocos = src.split(/\r?\n  \{\r?\n    slug: /).slice(1);
  const out = [];
  for (const b of blocos) {
    const slug = b.match(/^"([^"]+)"/)?.[1];
    const titulo = b.match(/titulo:\s*"([^"]+)"/)?.[1];
    const descricao = b.match(/descricao:\s*\n?\s*"([^"]+)"/)?.[1];
    const categoria = b.match(/categoria:\s*"([^"]+)"/)?.[1];
    const icone = b.match(/icon:\s*(\w+)/)?.[1];
    if (slug && titulo && descricao && categoria) out.push({ id: slug, nome: titulo, sub: descricao, categoria, icone: icone ?? "Shapes" });
  }
  return out;
}

// ------------------------------------------------------------------ cartão

const logo = await sharp(resolve(raiz, "src/assets/logo-full-transparent.png")).resize({ width: 220 }).toBuffer();

async function arteFoto(arquivo, w, h) {
  const foto = await sharp(resolve(raiz, arquivo))
    .resize(w, h, { fit: "cover", position: "attention" })
    .modulate({ saturation: 1.08 })
    .toBuffer();
  const mascara = Buffer.from(
    `<svg width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="28" fill="#fff"/></svg>`,
  );
  return sharp(foto).composite([{ input: mascara, blend: "dest-in" }]).png().toBuffer();
}

async function arteSvg(svg, w, h) {
  return sharp(Buffer.from(svg)).resize(w, h, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
}

function arteIcone(nome, cor2) {
  const s = 380;
  return Buffer.from(`<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="v" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity="0.32"/><stop offset="1" stop-color="#ffffff" stop-opacity="0.08"/></linearGradient>
    <filter id="s"><feDropShadow dx="0" dy="10" stdDeviation="14" flood-opacity="0.4"/></filter>
  </defs>
  <rect x="10" y="10" width="${s - 20}" height="${s - 20}" rx="72" fill="url(#v)" stroke="#ffffff" stroke-opacity="0.55" stroke-width="3" filter="url(#s)"/>
  <g transform="translate(${s / 2 - 120} ${s / 2 - 120}) scale(10)">${iconeSvg(nome, "#ffffff", 1.35)}</g>
</svg>`);
}

async function cartao({ tipo, id, titulo, sub, tag, cores, foto, arte, icone, selo, extra }) {
  const [c1, c2] = cores;
  const titLinhas = quebrar(titulo, titulo.length > 26 ? 20 : 17, 2);
  const tamTit = titLinhas.some((l) => l.length > 15) ? 56 : 64;
  const subLinhas = quebrar(sub, 42, 3);
  const y0 = 300;
  const texto = `
  <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="fundo" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>
      <radialGradient id="luz" cx="0.85" cy="0.1" r="0.7"><stop offset="0" stop-color="#ffffff" stop-opacity="0.28"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#fundo)"/>
    <rect width="${W}" height="${H}" fill="url(#luz)"/>
    <circle cx="1120" cy="560" r="230" fill="#ffffff" fill-opacity="0.06"/>
    <circle cx="70" cy="640" r="180" fill="#000000" fill-opacity="0.10"/>
    <rect x="0" y="0" width="12" height="${H}" fill="#fbbf24"/>
    <rect x="52" y="44" width="248" height="106" rx="18" fill="#ffffff"/>
    <g font-family="${FONTE}">
      <rect x="60" y="${y0 - 88}" width="${Math.max(220, tag.length * 13.5 + 44)}" height="38" rx="19" fill="#ffffff" fill-opacity="0.2"/>
      <text x="80" y="${y0 - 62}" font-size="18" font-weight="700" fill="#ffffff" letter-spacing="2">${esc(tag)}</text>
      ${titLinhas.map((l, i) => `<text x="60" y="${y0 + 44 + i * (tamTit + 8)}" font-size="${tamTit}" font-weight="800" fill="#ffffff">${esc(l)}</text>`).join("")}
      ${subLinhas.map((l, i) => `<text x="62" y="${y0 + 44 + titLinhas.length * (tamTit + 8) + 22 + i * 34}" font-size="25" fill="#ffffff" fill-opacity="0.92">${esc(l)}</text>`).join("")}
      <rect x="60" y="548" width="56" height="4" rx="2" fill="#fbbf24"/>
      <text x="60" y="580" font-size="19" font-weight="600" fill="#ffffff" fill-opacity="0.95">Escola Dr. Eiraldo Carneiro de França</text>
      <text x="60" y="606" font-size="16" fill="#ffffff" fill-opacity="0.75">Criado pelo professor Franc D'nis · 2026</text>
      ${selo ? `<text x="1140" y="600" font-size="20" font-weight="700" fill="#ffffff" fill-opacity="0.9" text-anchor="end">${esc(selo)} · Infoteca</text>` : `<text x="1140" y="600" font-size="20" font-weight="700" fill="#ffffff" fill-opacity="0.9" text-anchor="end">Agenda de Informática</text>`}
    </g>
  </svg>`;

  const camadas = [{ input: Buffer.from(texto), left: 0, top: 0 }, { input: logo, left: 66, top: 52 }];
  const PW = 560;
  const PH = 480;
  const px = 600;
  const py = 70;
  if (foto) {
    camadas.push({ input: await arteFoto(foto, PW, PH), left: px, top: py });
    // moldura branca fina
    camadas.push({
      input: Buffer.from(`<svg width="${PW}" height="${PH}"><rect x="2" y="2" width="${PW - 4}" height="${PH - 4}" rx="27" fill="none" stroke="#ffffff" stroke-opacity="0.85" stroke-width="4"/></svg>`),
      left: px,
      top: py,
    });
  } else if (arte) {
    camadas.push({ input: await arteSvg(arte, PW, PH), left: px, top: py });
  } else if (icone) {
    camadas.push({ input: arteIcone(icone, c2), left: px + 90, top: py + 50 });
  }
  if (extra) {
    const img = await sharp(resolve(raiz, `public/images/jogos/${extra}.png`)).resize({ height: 140 }).toBuffer();
    camadas.push({ input: img, left: px + PW - 130, top: py + PH - 130 });
  }
  await sharp({ create: { width: W, height: H, channels: 3, background: c1 } })
    .composite(camadas)
    .jpeg({ quality: 88, chromaSubsampling: "4:4:4" })
    .toFile(resolve(saida, `${tipo}-${id}.jpg`));
}

let n = 0;
for (const j of JOGOS) {
  await cartao({ tipo: "jogo", id: j.id, titulo: j.nome, sub: j.sub, tag: "JOGO", cores: j.cores, foto: j.foto, arte: j.arte, selo: j.selo, extra: j.extra });
  n++;
}
for (const s of SECOES) {
  await cartao({ tipo: "secao", id: s.id, titulo: s.nome, sub: s.sub, tag: "AGENDA DE INFORMÁTICA", cores: CATEGORIAS.Site, icone: s.icone });
  n++;
}
for (const f of lerFerramentas()) {
  const cat = CATEGORIAS[f.categoria] ?? CATEGORIAS.Ferramentas;
  await cartao({ tipo: "ferramenta", id: f.id, titulo: f.nome, sub: f.sub, tag: cat[2], cores: [cat[0], cat[1]], icone: f.icone, selo: "Ferramenta" });
  n++;
}
console.log(`${n} imagens geradas em public/og/`);
