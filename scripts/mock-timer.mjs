/**
 * Mock em alta fidelidade do cartão de aula ao vivo, para aprovação visual.
 * Renderiza os dois modos e dois estados, com a hero em qualidade real.
 */
import sharp from "sharp";

const E = 2; // 2x para inspecionar nitidez
const L = 680;
const HERO = 190;
const A = 560;

const paleta = {
  normal: { ac: "#0f766e", acs: "#ccfbf1", acd: "#134e4a", chip: "Em aula" },
  atencao: { ac: "#b45309", acs: "#fef3c7", acd: "#78350f", chip: "Faltam 5 min" },
};
const paletaEsc = {
  normal: { ac: "#2dd4bf", acs: "#10302e", acd: "#99f6e4", chip: "Em aula" },
  atencao: { ac: "#fbbf24", acs: "#2e2206", acd: "#fde68a", chip: "Faltam 5 min" },
};

const F = "Segoe UI, sans-serif";
const MONO = "Consolas, monospace";

async function hero() {
  return sharp("src/assets/alunos-hero.jpg")
    .resize(L * E, HERO * E, { fit: "cover", position: "right" })
    .toBuffer();
}

function svg({ escuro, estado, restaG, restaT, pct, grupo }) {
  const p = (escuro ? paletaEsc : paleta)[estado];
  const sup = escuro ? "#1a2233" : "#ffffff";
  const sup0 = escuro ? "#0f1626" : "#f8fafc";
  const sup1 = escuro ? "#151d2e" : "#f1f5f9";
  const tx = escuro ? "#e8ecf4" : "#0f172a";
  const tx2 = escuro ? "#9aa6bd" : "#475569";
  const tx3 = escuro ? "#6b7890" : "#94a3b8";
  const bd = estado === "atencao" ? p.ac : escuro ? "#273246" : "#e2e8f0";
  const bdf = escuro ? "#273246" : "#e2e8f0";
  const y0 = HERO;

  return Buffer.from(`
<svg width="${L}" height="${A}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="sc" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#040d14" stop-opacity=".92"/>
      <stop offset="42%" stop-color="#040d14" stop-opacity=".74"/>
      <stop offset="100%" stop-color="#040d14" stop-opacity=".18"/>
    </linearGradient>
    <clipPath id="cc"><rect x="0" y="0" width="${L}" height="${A}" rx="12"/></clipPath>
  </defs>

  <g clip-path="url(#cc)">
    <!-- começa abaixo da hero: pintar o cartão inteiro cobriria a foto -->
    <rect y="${HERO}" width="${L}" height="${A - HERO}" fill="${sup}"/>
    <rect width="${L}" height="${HERO}" fill="url(#sc)"/>

    <rect x="22" y="34" width="${p.chip.length * 7.1 + 32}" height="26" rx="13" fill="${p.acs}"/>
    <circle cx="36" cy="47" r="3.4" fill="${p.acd}"/>
    <text x="46" y="51" font-family="${F}" font-size="12.5" font-weight="500" fill="${p.acd}">${p.chip}</text>

    <text x="22" y="92" font-family="${F}" font-size="20" font-weight="500" fill="#ffffff">3º ano &#8220;A&#8221;</text>
    <text x="22" y="114" font-family="${F}" font-size="13" fill="#d3dae6">Introdução ao computador &#183; 7 máquinas</text>
    <text x="22" y="152" font-family="${F}" font-size="12.5" fill="#aab6c8">Segunda-feira &#183; 08:30 às 09:30</text>

    <text x="22" y="${y0 + 74}" font-family="${MONO}" font-size="56" font-weight="600" fill="${tx}" letter-spacing="-2">${restaG}</text>
    <text x="22" y="${y0 + 97}" font-family="${F}" font-size="13" fill="${tx2}">restam no grupo ${grupo}</text>

    <text x="${L - 22}" y="${y0 + 52}" text-anchor="end" font-family="${F}" font-size="20" font-weight="500" fill="${tx}">${grupo} de 2</text>
    <text x="${L - 22}" y="${y0 + 72}" text-anchor="end" font-family="${F}" font-size="13" fill="${tx2}">grupos no revezamento</text>
    <text x="${L - 22}" y="${y0 + 97}" text-anchor="end" font-family="${F}" font-size="13" fill="${tx2}">7 alunos na vez</text>

    <text x="22" y="${y0 + 130}" font-family="${F}" font-size="11.5" fill="${tx3}">Grupo 1</text>
    <text x="${L / 2 + 7}" y="${y0 + 130}" font-family="${F}" font-size="11.5" fill="${tx3}">Grupo 2</text>

    <rect x="22" y="${y0 + 140}" width="${L - 44}" height="16" rx="5" fill="${sup0}" stroke="${bdf}" stroke-width="1"/>
    <rect x="22" y="${y0 + 140}" width="${(L - 44) * pct}" height="16" rx="5" fill="${p.ac}" opacity=".22"/>
    <line x1="${L / 2}" y1="${y0 + 140}" x2="${L / 2}" y2="${y0 + 156}" stroke="${bdf}" stroke-width="1"/>
    <rect x="${22 + (L - 44) * pct - 1}" y="${y0 + 134}" width="2.5" height="28" rx="1.2" fill="${p.ac}"/>
    <circle cx="${22 + (L - 44) * pct}" cy="${y0 + 132}" r="4.5" fill="${p.ac}"/>

    <text x="22" y="${y0 + 176}" font-family="${F}" font-size="11.5" fill="${tx3}">08:30</text>
    <text x="${L / 2}" y="${y0 + 176}" text-anchor="middle" font-family="${F}" font-size="11.5" fill="${tx3}">09:00</text>
    <text x="${L - 22}" y="${y0 + 176}" text-anchor="end" font-family="${F}" font-size="11.5" fill="${tx3}">09:30</text>

    <line x1="22" y1="${y0 + 196}" x2="${L - 22}" y2="${y0 + 196}" stroke="${bdf}" stroke-width="1"/>
    <text x="22" y="${y0 + 219}" font-family="${F}" font-size="13" fill="${tx3}">A seguir</text>
    <text x="80" y="${y0 + 219}" font-family="${F}" font-size="13" font-weight="500" fill="${tx}">4º ano &#8220;B&#8221;</text>
    <text x="146" y="${y0 + 219}" font-family="${F}" font-size="13" fill="${tx2}">&#183; começa em ${restaT}</text>

    <g opacity=".5">
      <rect x="22" y="${y0 + 240}" width="128" height="34" rx="8" fill="none" stroke="${escuro ? "#3a4864" : "#cbd5e1"}" stroke-width="1"/>
      <text x="86" y="${y0 + 261}" text-anchor="middle" font-family="${F}" font-size="13" fill="${tx}">Aviso sonoro</text>
      <rect x="158" y="${y0 + 240}" width="104" height="34" rx="8" fill="none" stroke="${escuro ? "#3a4864" : "#cbd5e1"}" stroke-width="1"/>
      <text x="210" y="${y0 + 261}" text-anchor="middle" font-family="${F}" font-size="13" fill="${tx}">Modo TV</text>
      <rect x="270" y="${y0 + 240}" width="134" height="34" rx="8" fill="none" stroke="${escuro ? "#3a4864" : "#cbd5e1"}" stroke-width="1"/>
      <text x="337" y="${y0 + 261}" text-anchor="middle" font-family="${F}" font-size="13" fill="${tx}">Registrar falta</text>
    </g>

    <rect x="22" y="${y0 + 288}" width="${L - 44}" height="46" fill="${sup1}"/>
    <rect x="22" y="${y0 + 288}" width="2" height="46" fill="${escuro ? "#3a4864" : "#cbd5e1"}"/>
    <text x="36" y="${y0 + 307}" font-family="${F}" font-size="12.5" fill="${tx2}">Esta agenda é aberta para consulta. Os controles da aula ficam com a</text>
    <text x="36" y="${y0 + 324}" font-family="${F}" font-size="12.5" fill="${tx2}">coordenação e o professor — entre com sua conta para usá-los.</text>
  </g>
  <rect x="0.5" y="0.5" width="${L - 1}" height="${A - 1}" rx="12" fill="none" stroke="${bd}" stroke-width="${estado === "atencao" ? 1.5 : 1}"/>
</svg>`);
}

async function cartao(opts) {
  const h = await hero();
  const base = await sharp({
    create: { width: L * E, height: A * E, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: h, left: 0, top: 0 }])
    .png()
    .toBuffer();

  return sharp(base)
    .composite([{ input: svg(opts), left: 0, top: 0, density: 72 * E }])
    .png()
    .toBuffer();
}

const claro = await cartao({
  escuro: false, estado: "normal", restaG: "23:41", restaT: "24 min", pct: 0.606, grupo: 2,
});
const escuro = await cartao({
  escuro: true, estado: "atencao", restaG: "04:12", restaT: "5 min", pct: 0.93, grupo: 2,
});

const G = 28;
await sharp({
  create: { width: L * E * 2 + G * 3, height: A * E + G * 2, channels: 3, background: "#dde3ec" },
})
  .composite([
    { input: claro, left: G, top: G },
    { input: escuro, left: G * 2 + L * E, top: G },
  ])
  .png()
  .toFile("mock-timer.png");

console.log("mock-timer.png gerado");
