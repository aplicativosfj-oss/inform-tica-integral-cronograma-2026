import {
  Bold,
  Download,
  Italic,
  List,
  ListOrdered,
  Redo2,
  Trash2,
  Underline,
  Undo2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useConfirmar } from "@/lib/confirm-store";

const CHAVE_RASCUNHO = "informatica:editor-texto-rascunho";

function comando(nome: string, valor?: string) {
  document.execCommand(nome, false, valor);
}

export function EditorTexto() {
  const areaRef = useRef<HTMLDivElement>(null);
  const [contagem, setContagem] = useState(0);
  const confirmar = useConfirmar();

  useEffect(() => {
    const salvo = localStorage.getItem(CHAVE_RASCUNHO);
    if (salvo && areaRef.current) {
      areaRef.current.innerHTML = salvo;
      atualizarContagem();
    }
  }, []);

  function atualizarContagem() {
    const texto = areaRef.current?.innerText ?? "";
    setContagem(texto.trim().length === 0 ? 0 : texto.trim().split(/\s+/).length);
  }

  function salvarRascunho() {
    if (!areaRef.current) return;
    localStorage.setItem(CHAVE_RASCUNHO, areaRef.current.innerHTML);
    atualizarContagem();
  }

  async function limpar() {
    const ok = await confirmar({
      titulo: "Apagar todo o texto?",
      descricao: "Isso não pode ser desfeito.",
    });
    if (!ok || !areaRef.current) return;
    areaRef.current.innerHTML = "";
    localStorage.removeItem(CHAVE_RASCUNHO);
    setContagem(0);
  }

  function baixar() {
    const texto = areaRef.current?.innerText ?? "";
    const blob = new Blob([texto], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "meu-texto.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border/60 bg-card p-1.5">
        <Button variant="ghost" size="icon" className="size-8" onClick={() => comando("bold")}>
          <Bold className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" className="size-8" onClick={() => comando("italic")}>
          <Italic className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" className="size-8" onClick={() => comando("underline")}>
          <Underline className="size-4" />
        </Button>
        <div className="mx-1 h-5 w-px bg-border" />
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => comando("insertUnorderedList")}
        >
          <List className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => comando("insertOrderedList")}
        >
          <ListOrdered className="size-4" />
        </Button>
        <div className="mx-1 h-5 w-px bg-border" />
        <Select onValueChange={(v) => comando("fontSize", v)}>
          <SelectTrigger className="h-8 w-28">
            <SelectValue placeholder="Tamanho" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2">Pequeno</SelectItem>
            <SelectItem value="4">Normal</SelectItem>
            <SelectItem value="6">Grande</SelectItem>
            <SelectItem value="7">Enorme</SelectItem>
          </SelectContent>
        </Select>
        <div className="mx-1 h-5 w-px bg-border" />
        <Button variant="ghost" size="icon" className="size-8" onClick={() => comando("undo")}>
          <Undo2 className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" className="size-8" onClick={() => comando("redo")}>
          <Redo2 className="size-4" />
        </Button>
        <div className="ml-auto flex items-center gap-1">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={baixar}>
            <Download className="size-3.5" /> Baixar
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-destructive hover:bg-destructive/10"
            onClick={limpar}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <div
        ref={areaRef}
        contentEditable
        onInput={() => {
          atualizarContagem();
          salvarRascunho();
        }}
        className="min-h-[320px] rounded-lg border border-border/60 bg-card p-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        style={{ lineHeight: 1.6 }}
        suppressContentEditableWarning
      />
      <p className="text-right text-xs text-muted-foreground">
        {contagem} {contagem === 1 ? "palavra" : "palavras"} · salvo automaticamente neste
        computador
      </p>
    </div>
  );
}
