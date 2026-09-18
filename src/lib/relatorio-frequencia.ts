import type { Presenca } from "@/lib/types";

const STATUS_LABEL: Record<Presenca["status"], string> = {
  presente: "Presente",
  faltou: "Faltou",
  substituido: "Substituiu",
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatarData(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR");
}

export interface RelatorioFrequenciaInput {
  titulo: string;
  periodo: string;
  registros: Presenca[];
  /** id da turma -> nome legível ("2º Ano \"A\""). */
  nomeTurma: (turmaId: string) => string;
  professorInformatica?: string;
}

/**
 * Abre uma janela de impressão com o relatório de frequência formatado.
 * Usa o diálogo de impressão do navegador ("Salvar como PDF"), evitando
 * carregar uma biblioteca de PDF de centenas de KB no bundle da escola.
 * Retorna false quando o navegador bloqueia pop-ups.
 */
export function exportarFrequenciaPdf({
  titulo,
  periodo,
  registros,
  nomeTurma,
  professorInformatica,
}: RelatorioFrequenciaInput): boolean {
  const janela = window.open("", "_blank", "width=900,height=700");
  if (!janela) return false;

  const presentes = registros.filter((r) => r.status !== "faltou").length;
  const faltas = registros.filter((r) => r.status === "faltou").length;

  const linhas = [...registros]
    .sort((a, b) => a.data.localeCompare(b.data) || a.alunoNome.localeCompare(b.alunoNome))
    .map(
      (r) => `<tr>
        <td>${formatarData(r.data)}</td>
        <td>${escapeHtml(nomeTurma(r.turmaId))}</td>
        <td>${escapeHtml(r.alunoNome)}</td>
        <td>Grupo ${r.grupoIndice + 1}</td>
        <td class="${r.status === "faltou" ? "falta" : ""}">${STATUS_LABEL[r.status]}</td>
      </tr>`,
    )
    .join("");

  janela.document.write(`<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8" />
<title>${escapeHtml(titulo)}</title>
<style>
  @page { size: A4; margin: 16mm; }
  body { font-family: system-ui, -apple-system, "Segoe UI", sans-serif; color: #111; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  .sub { color: #555; font-size: 12px; margin: 0 0 16px; }
  .resumo { display: flex; gap: 24px; font-size: 13px; margin-bottom: 16px; }
  .resumo strong { font-size: 18px; display: block; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { border-bottom: 1px solid #ddd; padding: 6px 8px; text-align: left; }
  th { background: #f3f4f6; text-transform: uppercase; font-size: 10px; letter-spacing: .04em; }
  .falta { color: #b91c1c; font-weight: 600; }
  .assinatura { margin-top: 48px; font-size: 12px; color: #555; }
  .assinatura span { display: inline-block; border-top: 1px solid #888; padding-top: 4px; width: 260px; margin-right: 32px; }
</style></head><body>
<h1>${escapeHtml(titulo)}</h1>
<p class="sub">Período: ${escapeHtml(periodo)}${
    professorInformatica
      ? ` · Professor(a) de informática: ${escapeHtml(professorInformatica)}`
      : ""
  }</p>
<div class="resumo">
  <div>Participações<strong>${presentes}</strong></div>
  <div>Faltas<strong>${faltas}</strong></div>
  <div>Registros<strong>${registros.length}</strong></div>
</div>
<table><thead><tr>
  <th>Data</th><th>Turma</th><th>Aluno</th><th>Grupo</th><th>Situação</th>
</tr></thead><tbody>${
    linhas || `<tr><td colspan="5">Nenhum registro no período.</td></tr>`
  }</tbody></table>
<div class="assinatura"><span>Professor(a) de informática</span><span>Coordenação</span></div>
</body></html>`);
  janela.document.close();
  janela.focus();
  janela.print();
  return true;
}
