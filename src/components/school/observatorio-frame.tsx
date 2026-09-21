import { useMemo } from "react";

import template from "@/lib/observatorio-template.html?raw";

// O observatório é uma página HTML independente (gráficos em SVG e JS puro);
// roda isolado num iframe para não misturar CSS com o resto do site.
export function ObservatorioFrame({ dados, className }: { dados: unknown; className?: string }) {
  const srcDoc = useMemo(() => {
    const json = JSON.stringify(dados).replace(/</g, "\\u003c");
    return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0">${template.replace("/*DATA*/", json)}</body></html>`;
  }, [dados]);

  return (
    <iframe
      title="Observatório pedagógico"
      srcDoc={srcDoc}
      sandbox="allow-scripts allow-modals"
      className={className}
    />
  );
}

// Versão aberta ao público: tira a marcação de Educação Especial dos nomes
// (dado sensível de criança, LGPD art. 11).
export function versaoPublica<T>(dados: T): T {
  return JSON.parse(JSON.stringify(dados).replaceAll(" (Especial)", "")) as T;
}
