import { renderToStaticMarkup } from "react-dom/server";

import type { Questao } from "@/components/school/ferramentas/quiz";

/**
 * Kit de impressão: monta uma folha de atividades pronta para imprimir (ou
 * salvar em PDF), para usar com os grupos em sala sem computador. A última
 * página traz o gabarito para o professor.
 */

export interface BlocoImpressao {
  titulo: string;
  subtitulo?: string;
  texto?: { titulo?: string; paragrafos: string[] } | undefined;
  questoes: Questao[];
}

const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
const LETRAS = ["A", "B", "C", "D", "E"];

export function imprimirFolha(cabecalho: string, blocos: BlocoImpressao[], rodape = "") {
  // Copia os estilos do site para que as ilustrações (figuras, tabelas,
  // malhas) saiam iguais às da tela.
  const estilos = [...document.querySelectorAll('link[rel="stylesheet"], style')]
    .map((el) => el.outerHTML)
    .join("\n");

  let n = 0;
  const gabarito: string[] = [];
  const corpo = blocos
    .map((b) => {
      const qs = b.questoes
        .map((q) => {
          n += 1;
          gabarito.push(`<li><b>${n}.</b> ${LETRAS[q.respostaCorreta]} — ${esc(q.opcoes[q.respostaCorreta] ?? "")}</li>`);
          const ilus = q.ilustracao ? `<div class="ilus">${renderToStaticMarkup(<>{q.ilustracao}</>)}</div>` : "";
          const ops = q.opcoes
            .map((o, i) => `<li><span class="caixa"></span> <b>${LETRAS[i]})</b> ${esc(o)}</li>`)
            .join("");
          return `<div class="q"><p class="enun"><b>${n}.</b> ${esc(q.enunciado)}</p>${ilus}<ul class="ops">${ops}</ul></div>`;
        })
        .join("");
      const texto = b.texto?.paragrafos.length
        ? `<div class="texto">${b.texto.titulo ? `<p class="tt">${esc(b.texto.titulo)}</p>` : ""}${b.texto.paragrafos
            .map((p) => `<p>${esc(p)}</p>`)
            .join("")}</div>`
        : "";
      return `<section class="bloco"><h2>${esc(b.titulo)}</h2>${b.subtitulo ? `<p class="sub">${esc(b.subtitulo)}</p>` : ""}${texto}${qs}</section>`;
    })
    .join("");

  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${esc(cabecalho)}</title>${estilos}
<style>
  body{background:#fff!important;color:#111!important;font:15px/1.5 system-ui,sans-serif;margin:0;padding:24px}
  .folha{max-width:760px;margin:0 auto}
  .topo{border:2px solid #111;border-radius:10px;padding:10px 14px;display:grid;gap:6px;margin-bottom:16px}
  .topo h1{font-size:18px;margin:0}
  .linha{display:flex;gap:16px;font-size:14px}
  .linha span{flex:1;border-bottom:1px solid #999;padding-bottom:2px}
  h2{font-size:16px;margin:18px 0 2px}
  .sub{margin:0 0 8px;color:#444;font-size:13px}
  .texto{border-left:4px solid #999;padding:4px 12px;margin:8px 0 12px;background:#f6f6f6}
  .texto p{margin:4px 0}.texto .tt{font-weight:700}
  .q{break-inside:avoid;margin:10px 0 14px}
  .enun{margin:0 0 6px}
  .ilus{display:flex;justify-content:center;margin:6px 0}
  .ops{list-style:none;margin:0;padding:0 0 0 14px;display:grid;gap:4px}
  .caixa{display:inline-block;width:13px;height:13px;border:1.5px solid #333;border-radius:3px;vertical-align:-2px}
  .gabarito{break-before:page}
  .gabarito ol{list-style:none;padding:0;columns:2;font-size:13px}
  .rodape{margin-top:18px;font-size:12px;color:#555}
  .acoes{position:fixed;top:12px;right:12px}
  .acoes button{font:600 14px system-ui;padding:8px 14px;border-radius:8px;border:1px solid #333;background:#fff;cursor:pointer}
  @media print{.acoes{display:none}body{padding:0}}
</style></head><body><div class="folha">
<div class="acoes"><button onclick="print()">Imprimir</button></div>
<div class="topo"><h1>${esc(cabecalho)}</h1>
<div class="linha"><span>Nome:</span></div>
<div class="linha"><span>Turma:</span><span>Data: ____/____/______</span></div></div>
${corpo}
${rodape ? `<p class="rodape">${esc(rodape)}</p>` : ""}
<section class="gabarito"><h2>Gabarito (para o professor)</h2><ol>${gabarito.join("")}</ol></section>
</div></body></html>`;

  const janela = window.open("", "_blank");
  if (!janela) return false;
  janela.document.open();
  janela.document.write(html);
  janela.document.close();
  janela.focus();
  return true;
}
