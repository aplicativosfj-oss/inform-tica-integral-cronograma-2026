/**
 * Artes de compartilhamento (1200x630) das páginas principais do site —
 * Laboratório, Resultados, Avaliações, Infoteca, Entre Turnos etc.
 *
 * É o cartão que aparece quando alguém manda o link no WhatsApp, Facebook,
 * Instagram (direct), Telegram, LinkedIn ou X. Todas seguem o mesmo molde:
 * fundo azul-noite da escola, a cor própria da seção, um ícone grande, o
 * título, um resumo de uma frase e três destaques curtos.
 *
 * Os cartões de jogos e de ferramentas continuam em build-share-images.mjs.
 *
 * Saída: public/og/secao-<id>.jpg
 * Rode com: node scripts/build-section-cards.mjs
 * Depois suba VERSAO_ARTE em src/lib/compartilhar.ts, senão as redes
 * continuam mostrando a arte antiga que guardaram em cache.
 */
import sharp from "sharp";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const W = 1200;
const H = 630;
const TITULO = "Inter Display, Inter, DejaVu Sans, sans-serif";
const TEXTO = "Inter, DejaVu Sans, sans-serif";
const esc = (t) =>
  t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Quebra o texto em linhas de no máximo `max` caracteres. */
function quebrar(texto, max) {
  const out = [];
  let atual = "";
  for (const p of texto.split(/\s+/)) {
    if ((atual + " " + p).trim().length > max && atual) {
      out.push(atual);
      atual = p;
    } else atual = (atual + " " + p).trim();
  }
  if (atual) out.push(atual);
  return out;
}

/** Ícone do lucide (nome em kebab-case) como grupo SVG de 24x24. */
function icone(nome, cor, largura) {
  const arq = resolve(raiz, `node_modules/lucide-react/dist/esm/icons/${nome}.js`);
  if (!existsSync(arq)) throw new Error(`Ícone não encontrado: ${nome}`);
  const m = readFileSync(arq, "utf8").match(/const __iconNode = (\[[\s\S]*?\]);\n/);
  const nos = new Function(`return ${m[1]}`)();
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

// ------------------------------------------------------------------ seções

const SECOES = [
  {
    id: "agenda",
    selo: "LABORATÓRIO AO VIVO",
    titulo: "Laboratório de Informática",
    resumo: "Quem está no laboratório agora, até que horas e quem já foi nesta semana.",
    destaques: [
      ["radio", "Ao vivo"],
      ["calendar-days", "Semana inteira"],
      ["users-round", "Todas as turmas"],
    ],
    icone: "monitor-smartphone",
    cor: ["#10b981", "#047857"],
  },
  {
    id: "resultados",
    selo: "RESULTADOS 2026",
    titulo: "Resultados do|3º bimestre",
    resumo: "Como as turmas estão lendo e escrevendo, comparado com os bimestres anteriores.",
    destaques: [
      ["book-open-check", "Leitura e escrita"],
      ["trending-up", "1º ao 3º bimestre"],
      ["users-round", "Turma por turma"],
    ],
    icone: "chart-column",
    cor: ["#f59e0b", "#b45309"],
  },
  {
    id: "avaliacao",
    selo: "AVALIAÇÕES DIAGNÓSTICAS",
    titulo: "Avaliações Diagnósticas",
    resumo: "I e II Avaliação de 2026: quanto cada turma avançou e o que precisa ser retomado.",
    destaques: [
      ["clipboard-check", "I e II Avaliação"],
      ["trending-up", "Evolução"],
      ["target", "Descritores"],
    ],
    icone: "list-checks",
    cor: ["#8b5cf6", "#6d28d9"],
  },
  {
    id: "infoteca",
    selo: "INFOTECA",
    titulo: "Infoteca",
    resumo: "Jogos, ferramentas e plataformas educativas escolhidos a dedo, separados por assunto.",
    destaques: [
      ["gamepad-2", "Jogos educativos"],
      ["wrench", "Ferramentas"],
      ["heart-handshake", "Para famílias"],
    ],
    icone: "library-big",
    cor: ["#0ea5e9", "#0369a1"],
  },
  {
    id: "ferramentas",
    selo: "INFOTECA · ACESSO LIVRE",
    titulo: "Ferramentas abertas",
    resumo: "Ferramentas educativas para usar direto no navegador, sem login e sem instalar nada.",
    destaques: [
      ["calculator", "Matemática"],
      ["book-open", "Leitura e escrita"],
      ["shield-check", "Sem login"],
    ],
    icone: "wrench",
    cor: ["#14b8a6", "#0f766e"],
  },
  {
    id: "entre-turnos",
    selo: "DAS 11H ÀS 13H",
    titulo: "Entre Turnos",
    resumo: "Onde cada turma descansa, assiste a um filme ou brinca no intervalo do almoço.",
    destaques: [
      ["armchair", "Sala de aula"],
      ["popcorn", "Sala de filme"],
      ["dice-5", "Sala de jogos"],
    ],
    icone: "clock-3",
    cor: ["#fbbf24", "#d97706"],
  },
  {
    id: "sala-de-jogos",
    selo: "SALA DE JOGOS",
    titulo: "Sala de Jogos",
    resumo: "Damas, dominó, jogo da velha, memória, quebra-cabeça, digitação e mais.",
    destaques: [
      ["smartphone", "Instale no celular"],
      ["wifi-off", "Joga sem internet"],
      ["sparkles", "Grátis"],
    ],
    icone: "gamepad-2",
    cor: ["#22c55e", "#15803d"],
  },
  {
    id: "coordenacao",
    selo: "COORDENAÇÃO",
    titulo: "Uso do laboratório",
    resumo: "Quem foi, por quanto tempo e quantas vezes no mês, turma por turma.",
    destaques: [
      ["calendar-days", "Mês a mês"],
      ["timer", "Tempo de uso"],
      ["users-round", "Por turma"],
    ],
    icone: "users-round",
    cor: ["#3b82f6", "#1d4ed8"],
  },
  {
    id: "sobre",
    selo: "SOBRE O PROJETO",
    titulo: "A gente e o laboratório",
    resumo: "Como funciona o laboratório de informática da escola e quem faz isso acontecer.",
    destaques: [
      ["monitor-smartphone", "O laboratório"],
      ["graduation-cap", "A equipe"],
      ["map-pin", "Feijó, Acre"],
    ],
    icone: "school",
    cor: ["#f43f5e", "#be123c"],
  },
  {
    id: "tv",
    selo: "MODO TV",
    titulo: "Painel da TV",
    resumo: "Cronômetro em tela cheia com a turma da vez, o grupo e o conteúdo do dia.",
    destaques: [
      ["timer", "Cronômetro"],
      ["users-round", "Turma e grupo"],
      ["layers", "Conteúdo do dia"],
    ],
    icone: "monitor-play",
    cor: ["#06b6d4", "#0e7490"],
  },
];

// ------------------------------------------------------------------ cartão

const logo = await sharp(resolve(raiz, "src/assets/logo-full-transparent.png"))
  .resize({ width: 196 })
  .toBuffer();

function cartao(s) {
  const [cor, corEscura] = s.cor;
  // "|" no título marca onde quebrar a linha.
  const titLinhas = s.titulo.includes("|") ? s.titulo.split("|") : quebrar(s.titulo, 17);
  const tamTit = titLinhas.length > 1 ? 60 : 72;
  const resumo = quebrar(s.resumo, 46);
  if (resumo.length > 2)
    throw new Error(`Resumo de "${s.id}" passa de duas linhas: encurte o texto.`);

  const yTit = titLinhas.length > 1 ? 268 : 304;
  const yResumo = yTit + (titLinhas.length - 1) * (tamTit + 6) + 54;
  const yChips = 484;

  // Destaques: três pílulas lado a lado, largura conforme o texto.
  let x = 60;
  const chips = s.destaques
    .map(([ic, rot]) => {
      const w = Math.round(rot.length * 11.2 + 64);
      const g = `<g transform="translate(${x} ${yChips})">
        <rect width="${w}" height="46" rx="23" fill="#ffffff" fill-opacity="0.07" stroke="#ffffff" stroke-opacity="0.14"/>
        <g transform="translate(16 12) scale(0.9167)">${icone(ic, cor, 2.2)}</g>
        <text x="46" y="30" font-family="${TEXTO}" font-size="19" font-weight="600" fill="#ffffff" fill-opacity="0.92">${esc(rot)}</text>
      </g>`;
      x += w + 12;
      return g;
    })
    .join("");

  // Medalhão do ícone, à direita.
  const cx = 930;
  const cy = 300;
  const lado = 264;

  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="fundo" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0d0b26"/><stop offset="0.6" stop-color="#17143f"/><stop offset="1" stop-color="#231d5c"/>
    </linearGradient>
    <radialGradient id="brilho" cx="${cx / W}" cy="${cy / H}" r="0.55">
      <stop offset="0" stop-color="${cor}" stop-opacity="0.42"/><stop offset="0.55" stop-color="${cor}" stop-opacity="0.08"/><stop offset="1" stop-color="${cor}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="medalha" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${cor}"/><stop offset="1" stop-color="${corEscura}"/>
    </linearGradient>
    <linearGradient id="vidro" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.35"/><stop offset="0.5" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
    <pattern id="pontos" width="28" height="28" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1.4" fill="#ffffff" fill-opacity="0.07"/>
    </pattern>
    <filter id="sombra" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="24" stdDeviation="28" flood-color="#000000" flood-opacity="0.5"/>
    </filter>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#fundo)"/>
  <rect width="${W}" height="${H}" fill="url(#pontos)"/>
  <rect width="${W}" height="${H}" fill="url(#brilho)"/>

  <!-- anéis em volta do medalhão -->
  <circle cx="${cx}" cy="${cy}" r="196" fill="none" stroke="${cor}" stroke-opacity="0.35" stroke-width="2"/>
  <circle cx="${cx}" cy="${cy}" r="246" fill="none" stroke="#ffffff" stroke-opacity="0.08" stroke-width="2" stroke-dasharray="4 10"/>
  <circle cx="${cx + 139}" cy="${cy - 139}" r="9" fill="${cor}"/>
  <circle cx="${cx - 174}" cy="${cy + 91}" r="6" fill="#ffffff" fill-opacity="0.5"/>

  <!-- medalhão -->
  <g filter="url(#sombra)">
    <rect x="${cx - lado / 2}" y="${cy - lado / 2}" width="${lado}" height="${lado}" rx="64" fill="url(#medalha)"/>
  </g>
  <rect x="${cx - lado / 2}" y="${cy - lado / 2}" width="${lado}" height="${lado}" rx="64" fill="url(#vidro)"/>
  <rect x="${cx - lado / 2 + 1.5}" y="${cy - lado / 2 + 1.5}" width="${lado - 3}" height="${lado - 3}" rx="62.5" fill="none" stroke="#ffffff" stroke-opacity="0.35" stroke-width="3"/>
  <g transform="translate(${cx - 72} ${cy - 72}) scale(6)">${icone(s.icone, "#ffffff", 1.5)}</g>

  <!-- faixa de cor da seção -->
  <rect x="0" y="0" width="${W}" height="8" fill="${cor}"/>

  <!-- marca da escola -->
  <rect x="52" y="44" width="228" height="92" rx="18" fill="#ffffff"/>

  <g font-family="${TEXTO}">
    <circle cx="68" cy="${yTit - 86}" r="6" fill="${cor}"/>
    <text x="84" y="${yTit - 79}" font-size="19" font-weight="700" fill="${cor}" letter-spacing="2.4">${esc(s.selo)}</text>
    ${titLinhas.map((l, i) => `<text x="58" y="${yTit + i * (tamTit + 6)}" font-family="${TITULO}" font-size="${tamTit}" font-weight="800" fill="#ffffff" letter-spacing="-1">${esc(l)}</text>`).join("")}
    ${resumo.map((l, i) => `<text x="60" y="${yResumo + i * 36}" font-size="25" fill="#ffffff" fill-opacity="0.78">${esc(l)}</text>`).join("")}
  </g>

  ${chips}

  <!-- rodapé -->
  <rect x="60" y="560" width="1080" height="1" fill="#ffffff" fill-opacity="0.12"/>
  <g font-family="${TEXTO}">
    <text x="60" y="598" font-size="18" font-weight="600" fill="#ffffff" fill-opacity="0.9">Escola em Tempo Integral Dr. Eiraldo Carneiro de França</text>
    <text x="1140" y="598" font-size="18" fill="#ffffff" fill-opacity="0.6" text-anchor="end">Informática · Feijó, Acre</text>
  </g>
</svg>`;
}

const pedido = process.argv.slice(2);
let n = 0;
for (const s of SECOES) {
  if (pedido.length && !pedido.includes(s.id)) continue;
  await sharp(Buffer.from(cartao(s)))
    .composite([{ input: logo, left: 68, top: 52 }])
    .flatten({ background: "#0d0b26" })
    .jpeg({ quality: 90, chromaSubsampling: "4:4:4", mozjpeg: true })
    .toFile(resolve(raiz, `public/og/secao-${s.id}.jpg`));
  n++;
}
console.log(`${n} artes geradas em public/og/`);
