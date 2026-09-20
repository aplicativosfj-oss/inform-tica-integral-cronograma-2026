import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  FilePlus2,
  FileText,
  FolderOpen,
  ImageUp,
  IndentDecrease,
  IndentIncrease,
  Italic,
  List,
  ListOrdered,
  Loader2,
  Palette,
  Redo2,
  Save,
  SmilePlus,
  Trash2,
  Underline,
  Undo2,
} from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useConfirmar } from "@/lib/confirm-store";
import { lerAlunoSessao } from "@/lib/aluno-session";
import {
  excluirArquivoAluno,
  listarArquivosAluno,
  obterArquivoAluno,
  salvarArquivoAluno,
  type ArquivoAlunoResumo,
} from "@/lib/aluno-area";

const CHAVE_RASCUNHO = "informatica:editor-texto-rascunho";

const FONTES = [
  { valor: "Calibri, Carlito, Arial, sans-serif", rotulo: "Calibri" },
  { valor: "Arial, sans-serif", rotulo: "Arial" },
  { valor: "'Times New Roman', Times, serif", rotulo: "Times New Roman" },
  { valor: "Verdana, sans-serif", rotulo: "Verdana" },
  { valor: "'Courier New', monospace", rotulo: "Courier New" },
  { valor: "'Comic Sans MS', cursive", rotulo: "Comic Sans MS" },
] as const;

const TAMANHOS = [10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48] as const;

const CORES = [
  "#1f2937",
  "#dc2626",
  "#ea580c",
  "#ca8a04",
  "#16a34a",
  "#2563eb",
  "#7c3aed",
  "#db2777",
  "#ffffff",
];

const CORES_CAPA = [
  "bg-blue-100 text-blue-600",
  "bg-purple-100 text-purple-600",
  "bg-emerald-100 text-emerald-600",
  "bg-amber-100 text-amber-600",
  "bg-pink-100 text-pink-600",
] as const;

const QUANTIDADE_RECENTES = 5;

const EMOJIS_E_SIMBOLOS = [
  "😀", "😂", "😍", "🤔", "😮", "😢", "😴", "🙌", "👍", "👎",
  "👏", "🙏", "💪", "🎉", "✨", "⭐", "🔥", "❤️", "📚", "✏️",
  "🎓", "🏫", "🖥️", "💡", "🌟", "🌈", "☀️", "🌙", "⚽", "🎨",
  "✅", "❌", "❓", "❗", "➕", "➖", "✖️", "➗", "≈", "≠",
  "±", "√", "π", "°", "%", "→", "←", "↑", "↓", "★",
] as const;

function formatarRelativo(dataIso: string): string {
  const diffMin = Math.round((Date.now() - new Date(dataIso).getTime()) / 60000);
  const rtf = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });
  if (diffMin < 1) return "agora mesmo";
  if (diffMin < 60) return rtf.format(-diffMin, "minute");
  const diffHoras = Math.round(diffMin / 60);
  if (diffHoras < 24) return rtf.format(-diffHoras, "hour");
  return rtf.format(-Math.round(diffHoras / 24), "day");
}

function formatarDataHora(dataIso: string): string {
  const data = new Date(dataIso);
  const dataFormatada = data.toLocaleDateString("pt-BR");
  const horaFormatada = data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return `${dataFormatada} às ${horaFormatada}`;
}

function comando(nome: string, valor?: string) {
  document.execCommand(nome, false, valor);
}

export function EditorTexto() {
  const areaRef = useRef<HTMLDivElement>(null);
  // Clicar num botão fora da área de digitação (fonte, cor) tira o foco do
  // texto e o navegador esquece o que estava selecionado — sem isso, o
  // comando (ex.: mudar a fonte) seria aplicado a nada. Guardamos a seleção
  // aqui assim que o aluno solta o mouse ou o teclado dentro do texto, para
  // poder devolvê-la ao documento no instante de aplicar o comando.
  const selecaoSalvaRef = useRef<Range | null>(null);
  const [contagem, setContagem] = useState(0);
  const confirmar = useConfirmar();

  const sessao = lerAlunoSessao();

  function salvarSelecaoAtual() {
    const selecao = window.getSelection();
    if (!selecao || selecao.rangeCount === 0 || !areaRef.current) return;
    const range = selecao.getRangeAt(0);
    if (areaRef.current.contains(range.commonAncestorContainer)) {
      selecaoSalvaRef.current = range.cloneRange();
    }
  }

  function comandoComSelecao(nome: string, valor?: string) {
    areaRef.current?.focus();
    const selecao = window.getSelection();
    if (selecao && selecaoSalvaRef.current) {
      selecao.removeAllRanges();
      selecao.addRange(selecaoSalvaRef.current);
    }
    comando(nome, valor);
    salvarSelecaoAtual();
    setSujo(true);
  }

  /**
   * `execCommand("fontSize")` só aceita os números 1-7 (a escala antiga do
   * HTML), não um tamanho em pixels de verdade. O truque padrão é aplicar o
   * tamanho "7" (o maior da escala) e depois trocar a tag <font size="7">
   * gerada por um <span style="font-size:...px">, que aceita qualquer valor.
   */
  function aplicarTamanhoFonte(tamanhoPx: string) {
    areaRef.current?.focus();
    const selecao = window.getSelection();
    if (selecao && selecaoSalvaRef.current) {
      selecao.removeAllRanges();
      selecao.addRange(selecaoSalvaRef.current);
    }
    document.execCommand("fontSize", false, "7");
    areaRef.current?.querySelectorAll('font[size="7"]').forEach((el) => {
      const span = document.createElement("span");
      span.style.fontSize = `${tamanhoPx}px`;
      while (el.firstChild) span.appendChild(el.firstChild);
      el.replaceWith(span);
    });
    salvarSelecaoAtual();
    salvarRascunhoLocal();
    atualizarContagem();
    setSujo(true);
  }

  const imagemInputRef = useRef<HTMLInputElement>(null);

  function inserirImagem(e: ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    e.target.value = "";
    if (!arquivo) return;
    if (!arquivo.type.startsWith("image/")) {
      toast.error("Escolha um arquivo de imagem.");
      return;
    }
    if (arquivo.size > 4 * 1024 * 1024) {
      toast.error("Escolha uma imagem menor que 4 MB.");
      return;
    }
    const leitor = new FileReader();
    leitor.onload = () => {
      comandoComSelecao("insertImage", leitor.result as string);
      salvarRascunhoLocal();
      atualizarContagem();
    };
    leitor.readAsDataURL(arquivo);
  }

  const [arquivoAtualId, setArquivoAtualId] = useState<string | null>(null);
  const [titulo, setTitulo] = useState("Sem título");
  const [salvando, setSalvando] = useState(false);
  const [carregandoLista, setCarregandoLista] = useState(false);
  const [dialogAbrirAberto, setDialogAbrirAberto] = useState(false);
  const [arquivos, setArquivos] = useState<ArquivoAlunoResumo[]>([]);
  const [corAberta, setCorAberta] = useState(false);
  const [emojisAbertos, setEmojisAbertos] = useState(false);
  const [recentes, setRecentes] = useState<ArquivoAlunoResumo[]>([]);
  const [carregandoRecentes, setCarregandoRecentes] = useState(false);
  // Nível de recuo do parágrafo atual (0 a 4), só para desenhar o marcador
  // na régua — quem manda de verdade no recuo é o próprio navegador via
  // indent/outdent.
  const [nivelRecuo, setNivelRecuo] = useState(0);
  // Marca se o documento aberto (novo ou existente) tem alguma mudança desde
  // que foi criado/aberto/salvo pela última vez — usado para perguntar antes
  // de trocar de texto e o aluno perder o que ainda não salvou.
  const [sujo, setSujo] = useState(false);

  /**
   * Chamado antes de qualquer ação que troque o documento em tela (abrir
   * outro texto, começar um novo). Se não há nada arriscado a perder, deixa
   * passar direto; se há, pergunta e — quando o aluno está logado — oferece
   * salvar antes de continuar.
   */
  async function confirmarTrocaSeNecessario(): Promise<boolean> {
    const temConteudo = (areaRef.current?.innerText ?? "").trim().length > 0;
    if (!sujo || !temConteudo) return true;

    const ok = await confirmar({
      titulo: "Salvar alterações?",
      descricao: sessao
        ? "Este documento tem mudanças que ainda não foram salvas. Deseja salvar antes de continuar?"
        : "Este documento tem mudanças que ainda não foram salvas. Elas serão perdidas se você continuar.",
      textoConfirmar: sessao ? "Salvar e continuar" : "Continuar sem salvar",
    });
    if (!ok) return false;
    if (sessao) await salvar();
    return true;
  }

  function aplicarRecuo(direcao: 1 | -1) {
    comandoComSelecao(direcao === 1 ? "indent" : "outdent");
    setNivelRecuo((atual) => Math.min(4, Math.max(0, atual + direcao)));
  }

  function inserirEmoji(emoji: string) {
    comandoComSelecao("insertText", emoji);
    salvarRascunhoLocal();
    atualizarContagem();
    setEmojisAbertos(false);
  }

  useEffect(() => {
    const salvo = localStorage.getItem(CHAVE_RASCUNHO);
    if (salvo && areaRef.current) {
      areaRef.current.innerHTML = salvo;
      atualizarContagem();
      setSujo(true);
    }
    // Sem isso, cada Enter cria uma <div> nova com a margem padrão do
    // navegador (bem maior que o espaçamento entre linhas de um parágrafo de
    // verdade), e é isso que fazia o texto parecer com espaços enormes entre
    // as linhas depois de apertar Enter.
    document.execCommand("defaultParagraphSeparator", false, "p");
    carregarRecentes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function carregarRecentes() {
    const sessaoAtual = lerAlunoSessao();
    if (!sessaoAtual) return;
    setCarregandoRecentes(true);
    try {
      const lista = await listarArquivosAluno(sessaoAtual.alunoId, sessaoAtual.pin);
      setRecentes(lista.slice(0, QUANTIDADE_RECENTES));
    } catch {
      // Falha silenciosa: a lista de recentes é só um atalho de conveniência,
      // não vale interromper o aluno com um erro por causa dela.
    } finally {
      setCarregandoRecentes(false);
    }
  }

  function atualizarContagem() {
    const texto = areaRef.current?.innerText ?? "";
    setContagem(texto.trim().length === 0 ? 0 : texto.trim().split(/\s+/).length);
  }

  function salvarRascunhoLocal() {
    if (!areaRef.current) return;
    localStorage.setItem(CHAVE_RASCUNHO, areaRef.current.innerHTML);
    atualizarContagem();
  }

  async function novoDocumento() {
    if (!areaRef.current) return;
    const podeContinuar = await confirmarTrocaSeNecessario();
    if (!podeContinuar) return;
    areaRef.current.innerHTML = "";
    setArquivoAtualId(null);
    setTitulo("Sem título");
    localStorage.removeItem(CHAVE_RASCUNHO);
    setContagem(0);
    setSujo(false);
  }

  async function excluirDocumentoAtual() {
    if (!areaRef.current) return;
    const ok = await confirmar({
      titulo: "Apagar este documento?",
      descricao: "Isso não pode ser desfeito.",
    });
    if (!ok) return;

    if (sessao && arquivoAtualId) {
      try {
        await excluirArquivoAluno(sessao.alunoId, sessao.pin, arquivoAtualId);
        toast.success("Documento apagado.");
        carregarRecentes();
      } catch (err) {
        toast.error(`Não foi possível apagar: ${(err as Error).message}`);
        return;
      }
    }

    areaRef.current.innerHTML = "";
    setArquivoAtualId(null);
    setTitulo("Sem título");
    localStorage.removeItem(CHAVE_RASCUNHO);
    setContagem(0);
    setSujo(false);
  }

  async function salvar() {
    if (!areaRef.current) return;
    if (!sessao) {
      toast.error("Entre na sua área de aluno para salvar o documento.");
      return;
    }
    setSalvando(true);
    try {
      const novoId = await salvarArquivoAluno(
        sessao.alunoId,
        sessao.turmaId,
        sessao.pin,
        arquivoAtualId,
        titulo,
        areaRef.current.innerHTML,
      );
      setArquivoAtualId(novoId);
      setSujo(false);
      toast.success("Salvo na sua pasta.");
      carregarRecentes();
    } catch (err) {
      toast.error(`Não foi possível salvar: ${(err as Error).message}`);
    } finally {
      setSalvando(false);
    }
  }

  async function abrirLista() {
    if (!sessao) {
      toast.error("Entre na sua área de aluno para ver seus documentos.");
      return;
    }
    setDialogAbrirAberto(true);
    setCarregandoLista(true);
    try {
      const lista = await listarArquivosAluno(sessao.alunoId, sessao.pin);
      setArquivos(lista);
    } catch (err) {
      toast.error(`Não foi possível carregar seus documentos: ${(err as Error).message}`);
    } finally {
      setCarregandoLista(false);
    }
  }

  async function abrirDocumento(id: string) {
    if (!sessao || !areaRef.current) return;
    if (id === arquivoAtualId) {
      setDialogAbrirAberto(false);
      return;
    }
    const podeContinuar = await confirmarTrocaSeNecessario();
    if (!podeContinuar) return;
    try {
      const arquivo = await obterArquivoAluno(sessao.alunoId, sessao.pin, id);
      if (!arquivo) {
        toast.error("Documento não encontrado.");
        return;
      }
      areaRef.current.innerHTML = arquivo.conteudoHtml;
      setArquivoAtualId(arquivo.id);
      setTitulo(arquivo.titulo);
      atualizarContagem();
      setSujo(false);
      setDialogAbrirAberto(false);
      toast.success(`"${arquivo.titulo}" aberto.`);
    } catch (err) {
      toast.error(`Não foi possível abrir: ${(err as Error).message}`);
    }
  }

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start">
      {/* Painel lateral: últimos textos do aluno, para reabrir rápido sem
          precisar do diálogo "Abrir". Só aparece pra quem está logado. */}
      {sessao && (
        <aside className="order-2 shrink-0 md:order-1 md:w-44">
          <p className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Meus textos
          </p>
          {carregandoRecentes ? (
            <div className="flex justify-center py-4">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            </div>
          ) : recentes.length === 0 ? (
            <p className="px-1 text-xs text-muted-foreground">
              Seus textos salvos vão aparecer aqui.
            </p>
          ) : (
            <TooltipProvider delayDuration={300}>
              <div className="flex gap-1.5 overflow-x-auto pb-1 md:flex-col md:overflow-visible md:pb-0">
                {recentes.map((arquivo, indice) => (
                  <Tooltip key={arquivo.id}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => abrirDocumento(arquivo.id)}
                        className={`flex w-28 shrink-0 items-center gap-1.5 rounded-lg border p-1.5 text-left transition-colors md:w-full ${
                          arquivo.id === arquivoAtualId
                            ? "border-primary/50 bg-primary/5"
                            : "border-border/60 bg-card hover:bg-muted"
                        }`}
                      >
                        <span
                          className={`flex size-6 shrink-0 items-center justify-center rounded-md ${CORES_CAPA[indice % CORES_CAPA.length]}`}
                        >
                          <FileText className="size-3.5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-xs font-medium leading-tight text-foreground">
                            {arquivo.titulo}
                          </span>
                          <span className="block text-[10px] leading-tight text-muted-foreground">
                            {formatarRelativo(arquivo.atualizadoEm)}
                          </span>
                        </span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="text-xs">
                      <p className="font-medium">{arquivo.titulo}</p>
                      <p className="mt-1 opacity-90">Criado em {formatarDataHora(arquivo.criadoEm)}</p>
                      <p className="opacity-90">Atualizado em {formatarDataHora(arquivo.atualizadoEm)}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </TooltipProvider>
          )}
        </aside>
      )}

      <div className="order-1 flex min-w-0 flex-1 flex-col gap-3 md:order-2">
      {/* Barra de título estilo Word: nome do arquivo editável */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          className="h-8 max-w-xs font-medium"
          placeholder="Nome do documento"
        />
        {!sessao && (
          <p className="text-xs text-muted-foreground">
            Entre na sua área de aluno para salvar seus documentos.
          </p>
        )}
      </div>

      {/* Faixa de ferramentas cinza, igual à do Word */}
      <div className="flex flex-wrap items-center gap-1 rounded-lg border border-[#d8d6d2] bg-[#f3f2f1] p-1.5 dark:border-white/10 dark:bg-zinc-800">
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 bg-white dark:bg-zinc-700"
          onClick={novoDocumento}
        >
          <FilePlus2 className="size-3.5" /> Novo
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 bg-white dark:bg-zinc-700"
          onClick={abrirLista}
        >
          <FolderOpen className="size-3.5" /> Abrir
        </Button>
        <Button
          size="sm"
          className="h-8 gap-1.5"
          onClick={salvar}
          disabled={salvando}
        >
          {salvando ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Save className="size-3.5" />
          )}
          Salvar
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 bg-white text-destructive hover:bg-destructive/10 dark:bg-zinc-700"
          onClick={excluirDocumentoAtual}
        >
          <Trash2 className="size-3.5" /> Excluir
        </Button>

        <div className="mx-1 h-6 w-px bg-[#d8d6d2] dark:bg-white/10" />

        <Select onValueChange={(v) => comandoComSelecao("fontName", v)}>
          <SelectTrigger className="h-8 w-40 bg-white dark:bg-zinc-700">
            <SelectValue placeholder="Fonte" />
          </SelectTrigger>
          <SelectContent>
            {FONTES.map((f) => (
              <SelectItem key={f.valor} value={f.valor} style={{ fontFamily: f.valor }}>
                {f.rotulo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select onValueChange={aplicarTamanhoFonte}>
          <SelectTrigger className="h-8 w-20 bg-white dark:bg-zinc-700">
            <SelectValue placeholder="Tam." />
          </SelectTrigger>
          <SelectContent>
            {TAMANHOS.map((t) => (
              <SelectItem key={t} value={String(t)}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="mx-1 h-6 w-px bg-[#d8d6d2] dark:bg-white/10" />

        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => comandoComSelecao("bold")}
          title="Negrito"
        >
          <Bold className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => comandoComSelecao("italic")}
          title="Itálico"
        >
          <Italic className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => comandoComSelecao("underline")}
          title="Sublinhado"
        >
          <Underline className="size-4" />
        </Button>

        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => setCorAberta((v) => !v)}
            title="Cor do texto"
          >
            <Palette className="size-4" />
          </Button>
          {corAberta && (
            <div
              className="absolute left-0 top-9 z-20 grid w-[148px] grid-cols-5 gap-1.5 rounded-lg border border-border bg-popover p-2 shadow-lg"
            >
              {CORES.map((cor) => (
                <button
                  key={cor}
                  type="button"
                  className="size-6 shrink-0 rounded-full ring-1 ring-black/15 transition-transform hover:scale-110"
                  style={{ backgroundColor: cor }}
                  onClick={() => {
                    comandoComSelecao("foreColor", cor);
                    setCorAberta(false);
                  }}
                  aria-label={`Cor ${cor}`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="mx-1 h-6 w-px bg-[#d8d6d2] dark:bg-white/10" />

        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => comandoComSelecao("justifyLeft")}
          title="Alinhar à esquerda"
        >
          <AlignLeft className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => comandoComSelecao("justifyCenter")}
          title="Centralizar"
        >
          <AlignCenter className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => comandoComSelecao("justifyRight")}
          title="Alinhar à direita"
        >
          <AlignRight className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => comandoComSelecao("justifyFull")}
          title="Justificar"
        >
          <AlignJustify className="size-4" />
        </Button>

        <div className="mx-1 h-6 w-px bg-[#d8d6d2] dark:bg-white/10" />

        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => aplicarRecuo(-1)}
          title="Diminuir recuo"
        >
          <IndentDecrease className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => aplicarRecuo(1)}
          title="Aumentar recuo"
        >
          <IndentIncrease className="size-4" />
        </Button>

        <div className="mx-1 h-6 w-px bg-[#d8d6d2] dark:bg-white/10" />

        <input
          ref={imagemInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={inserirImagem}
        />
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => imagemInputRef.current?.click()}
          title="Inserir imagem"
        >
          <ImageUp className="size-4" />
        </Button>

        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => setEmojisAbertos((v) => !v)}
            title="Emojis e símbolos"
          >
            <SmilePlus className="size-4" />
          </Button>
          {emojisAbertos && (
            <div className="absolute left-0 top-9 z-20 grid w-64 grid-cols-10 gap-0.5 rounded-lg border border-border bg-popover p-2 shadow-lg">
              {EMOJIS_E_SIMBOLOS.map((emoji, indice) => (
                <button
                  key={`${emoji}-${indice}`}
                  type="button"
                  className="flex size-6 items-center justify-center rounded text-base hover:bg-muted"
                  onClick={() => inserirEmoji(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mx-1 h-6 w-px bg-[#d8d6d2] dark:bg-white/10" />

        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => comandoComSelecao("insertUnorderedList")}
          title="Lista com marcadores"
        >
          <List className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => comandoComSelecao("insertOrderedList")}
          title="Lista numerada"
        >
          <ListOrdered className="size-4" />
        </Button>

        <div className="mx-1 h-6 w-px bg-[#d8d6d2] dark:bg-white/10" />

        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => comando("undo")}
          title="Desfazer"
        >
          <Undo2 className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => comando("redo")}
          title="Refazer"
        >
          <Redo2 className="size-4" />
        </Button>
      </div>

      {/* Régua horizontal, só decorativa/de referência (como a do Word), com
          o marcador do recuo padrão de parágrafo (1,25cm) já aplicado no
          texto e, se o aluno usar "Aumentar recuo", um segundo marcador. */}
      <div className="mx-auto hidden w-full max-w-[800px] select-none sm:block">
        <div className="relative h-5 overflow-hidden rounded-t-sm border border-b-0 border-[#d8d6d2] bg-[#ececea] dark:border-white/10 dark:bg-zinc-700">
          {Array.from({ length: 22 }).map((_, cm) => (
            <div
              key={cm}
              className="absolute top-0 h-full border-l border-[#c3c1bd] dark:border-white/20"
              style={{ left: `${cm * 37.8}px` }}
            >
              {cm % 5 === 0 && (
                <span className="absolute left-1 top-0.5 text-[9px] text-[#8a8886] dark:text-white/50">
                  {cm}
                </span>
              )}
            </div>
          ))}
          <div
            className="absolute top-0 h-full w-0 border-l-2 border-primary"
            style={{ left: `${1.25 * 37.8}px` }}
            title="Recuo padrão do parágrafo: 1,25cm"
          />
          {nivelRecuo > 0 && (
            <div
              className="absolute top-0 h-full w-0 border-l-2 border-dashed border-amber-500"
              style={{ left: `${(1.25 + nivelRecuo * 1.25) * 37.8}px` }}
              title={`Recuo aplicado: ${(1.25 + nivelRecuo * 1.25).toFixed(2).replace(".", ",")}cm`}
            />
          )}
        </div>
      </div>

      {/* "Folha" branca centralizada sobre fundo cinza, como no Word */}
      <div className="rounded-lg bg-[#e7e5e2] p-4 dark:bg-zinc-900 sm:p-8">
        <div
          ref={areaRef}
          contentEditable
          onInput={() => {
            atualizarContagem();
            salvarRascunhoLocal();
            setSujo(true);
          }}
          onMouseUp={salvarSelecaoAtual}
          onKeyUp={salvarSelecaoAtual}
          className="mx-auto min-h-[500px] w-full max-w-[800px] rounded-sm bg-white p-6 text-sm text-[#1f2937] shadow-md focus:outline-none sm:p-16 [&_div]:mb-0 [&_div]:mt-0 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-sm [&_p]:mb-3 [&_p]:mt-0 [&_p]:indent-[1.25cm]"
          style={{ lineHeight: 1.6, fontFamily: "Calibri, Carlito, Arial, sans-serif" }}
          suppressContentEditableWarning
        />
      </div>

      <p className="text-right text-xs text-muted-foreground">
        {contagem} {contagem === 1 ? "palavra" : "palavras"} ·{" "}
        {sessao ? "salvo na sua pasta ao clicar em Salvar" : "salvo automaticamente neste computador"}
      </p>
      </div>

      <Dialog open={dialogAbrirAberto} onOpenChange={setDialogAbrirAberto}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Seus documentos</DialogTitle>
            <DialogDescription>Escolha um documento para abrir.</DialogDescription>
          </DialogHeader>
          {carregandoLista ? (
            <div className="flex justify-center py-6">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : arquivos.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Você ainda não salvou nenhum documento.
            </p>
          ) : (
            <div className="flex max-h-72 flex-col gap-1 overflow-y-auto">
              {arquivos.map((arquivo) => (
                <button
                  key={arquivo.id}
                  type="button"
                  onClick={() => abrirDocumento(arquivo.id)}
                  className="flex flex-col rounded-lg border border-border/60 px-3 py-2 text-left transition-colors hover:bg-muted"
                >
                  <span className="text-sm font-medium text-foreground">{arquivo.titulo}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(arquivo.atualizadoEm).toLocaleString("pt-BR")}
                  </span>
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
