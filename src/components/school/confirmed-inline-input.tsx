import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { useConfirmar } from "@/lib/confirm-store";

/**
 * Campo de texto editável inline (nome, conteúdo, etc.) que só pede
 * confirmação — e só de fato salva — quando o administrador sai do campo
 * (blur) ou aperta Enter, e apenas se o valor realmente mudou. Pedir
 * confirmação a cada tecla digitada tornaria a edição impossível de usar;
 * confirmar "a alteração" (o valor final) é o que realmente importa aqui.
 */
export function ConfirmedInlineInput({
  valor,
  placeholder,
  titulo,
  descricao,
  onSalvar,
  className,
}: {
  valor: string;
  placeholder?: string;
  titulo: string;
  descricao: string;
  onSalvar: (novoValor: string) => void;
  className?: string;
}) {
  const confirmar = useConfirmar();
  const [rascunho, setRascunho] = useState(valor);

  useEffect(() => setRascunho(valor), [valor]);

  async function commit() {
    if (rascunho === valor) return;
    const ok = await confirmar({ titulo, descricao });
    if (!ok) {
      setRascunho(valor);
      return;
    }
    onSalvar(rascunho);
  }

  return (
    <Input
      className={className}
      placeholder={placeholder}
      value={rascunho}
      onChange={(e) => setRascunho(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          void commit();
        }
      }}
    />
  );
}
