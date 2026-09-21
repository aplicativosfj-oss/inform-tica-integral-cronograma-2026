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
  PanelLeft,
  PanelRight,
  Palette,
  Redo2,
  Save,
  SmilePlus,
  Square,
  Trash2,
  Type,
  Underline,
  Undo2,
  X,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
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
  "😀",
  "😂",
  "😍",
  "🤔",
  "😮",
  "😢",
  "😴",
  "🙌",
  "👍",
  "👎",
  "👏",
  "🙏",
  "💪",
  "🎉",
  "✨",
  "⭐",
  "🔥",
  "❤️",
  "📚",
  "✏️",
  "🎓",
  "🏫",
  "🖥️",
  "💡",
  "🌟",
  "🌈",
  "☀️",
  "🌙",
  "⚽",
  "🎨",
  "✅",
  "❌",
  "❓",
  "❗",
  "➕",
  "➖",
  "✖️",
  "➗",
  "≈",
  "≠",
  "±",
  "√",
  "π",
  "°",
  "%",
  "→",
  "←",
  "↑",
  "↓",
  "★",
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

/** Estado do que está sendo arrastado no momento (imagem/caixa de texto). */
interface EstadoArraste {
  tipo: "imagem" | "textbox-mover" | "textbox-redimensionar";
  elemento: HTMLElement;
  /** id do ponteiro (mouse/dedo/caneta) que começou o arraste. */
  ponteiro: number;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
  startLeft: number;
  startTop: number;
}

/**
 * Deixa uma caixa de texto pronta para ser arrastada/redimensionada.
 *
 * Isso é aplicado tanto nas caixas recém-inseridas quanto nas que vêm de um
 * documento salvo antes desta correção: sem `position`/`left`/`top` no
 * próprio elemento não há de onde partir o arraste, e sem `draggable=false`
 * o navegador tenta fazer o *drag and drop* nativo do bloco não-editável
 * (é isso que fazia a alcinha "não responder" ao mouse).
 */
function prepararCaixaTexto(caixa: HTMLElement) {
  caixa.setAttribute("contenteditable", "false");
  caixa.setAttribute("draggable", "false");
  caixa.style.position = "absolute";
  caixa.style.boxSizing = "border-box";
  if (!caixa.style.left) caixa.style.left = `${caixa.offsetLeft || 32}px`;
  if (!caixa.style.top) caixa.style.top = `${caixa.offsetTop || 32}px`;
  caixa
    .querySelectorAll<HTMLElement>(
      ".editor-textbox-handle, .editor-textbox-resize, .editor-textbox-delete",
    )
    .forEach((alca) => {
      alca.setAttribute("draggable", "false");
      alca.style.touchAction = "none";
      alca.style.userSelect = "none";
    });
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

  // Imagem atualmente selecionada na página (mostra a barrinha flutuante de
  // alinhamento/tamanho) e o que está sendo arrastado (redimensionar imagem,
  // mover ou redimensionar caixa de texto).
  const [imagemSelecionada, setImagemSelecionada] = useState<HTMLElement | null>(null);
  const [posicaoBarraImagem, setPosicaoBarraImagem] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const arrastandoRef = useRef<EstadoArraste | null>(null);

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

  /**
   * A imagem é inserida dentro de um "envelope" (`.editor-img-wrap`) que não
   * é editável (`contenteditable="false"`) e carrega uma alcinha
   * (`.editor-img-handle`) no canto: é nela que o aluno arrasta para
   * redimensionar. O envelope também guarda o alinhamento atual em
   * `data-align`, usado pelos botões da barrinha flutuante.
   */
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
      const src = leitor.result as string;
      const html =
        `<span class="editor-img-wrap" contenteditable="false" draggable="false" data-align="inline" ` +
        `style="display:inline-block;position:relative;max-width:100%;margin:0 4px;vertical-align:middle;">` +
        `<button type="button" class="editor-img-delete" contenteditable="false" title="Remover imagem" ` +
        `style="position:absolute;left:-8px;top:-8px;width:18px;height:18px;border-radius:9999px;background:#dc2626;` +
        `color:#fff;border:2px solid #fff;font-size:11px;line-height:1;cursor:pointer;display:none;align-items:center;justify-content:center;">×</button>` +
        `<img src="${src}" draggable="false" style="width:320px;max-width:100%;height:auto;display:block;border-radius:2px;" />` +
        `<span class="editor-img-handle" contenteditable="false" title="Arrastar para redimensionar" ` +
        `style="position:absolute;right:-6px;bottom:-6px;width:14px;height:14px;border-radius:9999px;background:#2563eb;` +
        `border:2px solid #fff;cursor:nwse-resize;display:none;"></span></span>&nbsp;`;
      comandoComSelecao("insertHTML", html);
      salvarRascunhoLocal();
      atualizarContagem();
    };
    leitor.readAsDataURL(arquivo);
  }

  /**
   * Insere uma caixa de texto independente, que fica flutuando sobre a
   * folha e pode ser arrastada para qualquer posição (pela alcinha roxa no
   * canto superior) e redimensionada (pela alcinha no canto inferior
   * direito). Como fica com `position:absolute`, ela é posicionada em
   * relação à própria área de digitação (que agora é `position:relative`).
   */
  function inserirCaixaTexto() {
    areaRef.current?.focus();
    const html =
      `<div class="editor-textbox" contenteditable="false" draggable="false" ` +
      `style="position:absolute;left:32px;top:32px;width:220px;min-height:100px;z-index:5;` +
      `background:#ffffff;border:1px dashed #94a3b8;border-radius:4px;padding:10px;box-shadow:0 1px 4px rgba(0,0,0,.08);">` +
      `<span class="editor-textbox-handle" contenteditable="false" draggable="false" title="Arrastar caixa de texto" ` +
      `style="position:absolute;top:-11px;left:-11px;width:18px;height:18px;border-radius:9999px;background:#7c3aed;` +
      `border:2px solid #fff;cursor:move;touch-action:none;user-select:none;"></span>` +
      `<button type="button" class="editor-textbox-delete" contenteditable="false" draggable="false" title="Remover caixa de texto" ` +
      `style="position:absolute;top:-11px;right:-11px;width:18px;height:18px;border-radius:9999px;background:#dc2626;` +
      `color:#fff;border:2px solid #fff;font-size:11px;line-height:1;cursor:pointer;">×</button>` +
      `<div class="editor-textbox-content" contenteditable="true" style="outline:none;min-height:60px;font-size:14px;line-height:1.4;">Digite aqui...</div>` +
      `<span class="editor-textbox-resize" contenteditable="false" draggable="false" title="Redimensionar caixa de texto" ` +
      `style="position:absolute;right:-6px;bottom:-6px;width:14px;height:14px;border-radius:9999px;background:#7c3aed;` +
      `border:2px solid #fff;cursor:nwse-resize;touch-action:none;user-select:none;"></span></div>`;
    document.execCommand("insertHTML", false, html);
    prepararCaixasTexto();
    salvarRascunhoLocal();
    atualizarContagem();
    setSujo(true);
  }

  /** Aplica `prepararCaixaTexto` em todas as caixas da folha. */
  function prepararCaixasTexto() {
    areaRef.current
      ?.querySelectorAll<HTMLElement>(".editor-textbox")
      .forEach((caixa) => prepararCaixaTexto(caixa));
  }

  function atualizarPosicaoBarraImagem(wrap: HTMLElement) {
    const rect = wrap.getBoundingClientRect();
    setPosicaoBarraImagem({ top: rect.top - 44, left: rect.left });
  }

  function selecionarImagem(wrap: HTMLElement) {
    if (imagemSelecionada && imagemSelecionada !== wrap) desselecionarImagem();
    wrap.querySelectorAll<HTMLElement>(".editor-img-handle, .editor-img-delete").forEach((el) => {
      el.style.display = "flex";
    });
    setImagemSelecionada(wrap);
    atualizarPosicaoBarraImagem(wrap);
  }

  function desselecionarImagem() {
    imagemSelecionada
      ?.querySelectorAll<HTMLElement>(".editor-img-handle, .editor-img-delete")
      .forEach((el) => {
        el.style.display = "none";
      });
    setImagemSelecionada(null);
    setPosicaoBarraImagem(null);
  }

  /**
   * Aplica o alinhamento na imagem selecionada: "em linha" (comportamento
   * padrão, no meio do texto), "esquerda"/"direita" (a imagem flutua para o
   * lado e o texto contorna, como no Word) ou "centro" (a imagem fica
   * sozinha numa linha, centralizada).
   */
  function aplicarAlinhamentoImagem(alinhamento: "inline" | "esquerda" | "direita" | "centro") {
    if (!imagemSelecionada) return;
    const wrap = imagemSelecionada;
    wrap.dataset["align"] = alinhamento;
    wrap.style.float = "none";
    wrap.style.display = "inline-block";
    wrap.style.margin = "0 4px";
    if (alinhamento === "esquerda") {
      wrap.style.float = "left";
      wrap.style.margin = "4px 14px 4px 0";
    } else if (alinhamento === "direita") {
      wrap.style.float = "right";
      wrap.style.margin = "4px 0 4px 14px";
    } else if (alinhamento === "centro") {
      wrap.style.display = "block";
      wrap.style.margin = "10px auto";
    }
    atualizarPosicaoBarraImagem(wrap);
    salvarRascunhoLocal();
    setSujo(true);
  }

  function excluirImagemSelecionada() {
    imagemSelecionada?.remove();
    desselecionarImagem();
    salvarRascunhoLocal();
    atualizarContagem();
    setSujo(true);
  }

  /** Clique dentro da folha: seleciona/deseleciona imagem ou apaga um item. */
  function aoClicarNaArea(e: ReactMouseEvent<HTMLDivElement>) {
    const alvo = e.target as HTMLElement;

    const botaoExcluirImagem = alvo.closest(".editor-img-delete");
    if (botaoExcluirImagem) {
      e.preventDefault();
      botaoExcluirImagem.closest<HTMLElement>(".editor-img-wrap")?.remove();
      desselecionarImagem();
      salvarRascunhoLocal();
      atualizarContagem();
      setSujo(true);
      return;
    }

    const botaoExcluirCaixa = alvo.closest(".editor-textbox-delete");
    if (botaoExcluirCaixa) {
      e.preventDefault();
      botaoExcluirCaixa.closest<HTMLElement>(".editor-textbox")?.remove();
      salvarRascunhoLocal();
      atualizarContagem();
      setSujo(true);
      return;
    }

    const wrap = alvo.closest<HTMLElement>(".editor-img-wrap");
    if (wrap) {
      selecionarImagem(wrap);
    } else if (imagemSelecionada) {
      desselecionarImagem();
    }
  }

  // Arraste das alcinhas (imagem e caixa de texto).
  //
  // Os eventos são de *ponteiro* (mouse, dedo ou caneta) e presos direto na
  // folha com `capture: true`: dentro de um `contenteditable` o navegador
  // trata o próprio mousedown como início de seleção/arraste nativo do bloco
  // não-editável, e engolia o evento antes de ele chegar ao React — por isso
  // a alcinha parecia "morta". Com a captura do ponteiro o arraste também
  // continua quando o cursor sai da folha, e funciona no touch.
  useEffect(() => {
    const area = areaRef.current;
    if (!area) return;

    function iniciarArraste(e: PointerEvent) {
      const alvo = e.target as HTMLElement | null;
      if (!alvo) return;

      const alcaImagem = alvo.closest(".editor-img-handle");
      const alcaMoverCaixa = alvo.closest(".editor-textbox-handle");
      const alcaRedimensionarCaixa = alvo.closest(".editor-textbox-resize");
      if (!alcaImagem && !alcaMoverCaixa && !alcaRedimensionarCaixa) return;

      // Impede a seleção de texto e o drag-and-drop nativo do bloco.
      e.preventDefault();
      e.stopPropagation();

      const base = {
        ponteiro: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
      };

      if (alcaImagem) {
        const img = alcaImagem.closest(".editor-img-wrap")?.querySelector("img");
        if (!img) return;
        const rect = img.getBoundingClientRect();
        arrastandoRef.current = {
          ...base,
          tipo: "imagem",
          elemento: img,
          startWidth: rect.width,
          startHeight: rect.height,
          startLeft: 0,
          startTop: 0,
        };
      } else if (alcaMoverCaixa) {
        const caixa = alcaMoverCaixa.closest<HTMLElement>(".editor-textbox");
        if (!caixa) return;
        prepararCaixaTexto(caixa);
        arrastandoRef.current = {
          ...base,
          tipo: "textbox-mover",
          elemento: caixa,
          startWidth: 0,
          startHeight: 0,
          // `offsetLeft/offsetTop` já é a posição real dentro da folha, então
          // a caixa não "pula" para o canto quando o style.left vem vazio ou
          // em outra unidade (era o que zerava o arraste antes).
          startLeft: caixa.offsetLeft,
          startTop: caixa.offsetTop,
        };
      } else if (alcaRedimensionarCaixa) {
        const caixa = alcaRedimensionarCaixa.closest<HTMLElement>(".editor-textbox");
        if (!caixa) return;
        prepararCaixaTexto(caixa);
        const rect = caixa.getBoundingClientRect();
        arrastandoRef.current = {
          ...base,
          tipo: "textbox-redimensionar",
          elemento: caixa,
          startWidth: rect.width,
          startHeight: rect.height,
          startLeft: 0,
          startTop: 0,
        };
      }

      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {
        // Navegador sem captura de ponteiro: os listeners de window abaixo
        // dão conta do recado sozinhos.
      }
    }

    function aoMoverPonteiro(e: PointerEvent) {
      const estado = arrastandoRef.current;
      if (!estado || e.pointerId !== estado.ponteiro) return;
      e.preventDefault();
      const dx = e.clientX - estado.startX;
      const dy = e.clientY - estado.startY;

      if (estado.tipo === "imagem") {
        const novaLargura = Math.max(40, Math.round(estado.startWidth + dx));
        estado.elemento.style.width = `${novaLargura}px`;
        const wrap = estado.elemento.closest<HTMLElement>(".editor-img-wrap");
        if (wrap) atualizarPosicaoBarraImagem(wrap);
      } else if (estado.tipo === "textbox-redimensionar") {
        estado.elemento.style.width = `${Math.max(80, Math.round(estado.startWidth + dx))}px`;
        estado.elemento.style.height = `${Math.max(48, Math.round(estado.startHeight + dy))}px`;
      } else if (estado.tipo === "textbox-mover") {
        estado.elemento.style.left = `${Math.round(estado.startLeft + dx)}px`;
        estado.elemento.style.top = `${Math.round(estado.startTop + dy)}px`;
      }
    }

    function aoSoltarPonteiro(e: PointerEvent) {
      const estado = arrastandoRef.current;
      if (!estado || e.pointerId !== estado.ponteiro) return;
      arrastandoRef.current = null;
      salvarRascunhoLocal();
      atualizarContagem();
      setSujo(true);
    }

    // O navegador ainda pode tentar arrastar a imagem/caixa como um objeto;
    // aqui esse arraste nativo é barrado de vez.
    function barrarArrasteNativo(e: DragEvent) {
      const alvo = e.target as HTMLElement | null;
      if (alvo?.closest(".editor-textbox, .editor-img-wrap")) e.preventDefault();
    }

    area.addEventListener("pointerdown", iniciarArraste, { capture: true });
    area.addEventListener("dragstart", barrarArrasteNativo);
    window.addEventListener("pointermove", aoMoverPonteiro);
    window.addEventListener("pointerup", aoSoltarPonteiro);
    window.addEventListener("pointercancel", aoSoltarPonteiro);
    return () => {
      area.removeEventListener("pointerdown", iniciarArraste, { capture: true });
      area.removeEventListener("dragstart", barrarArrasteNativo);
      window.removeEventListener("pointermove", aoMoverPonteiro);
      window.removeEventListener("pointerup", aoSoltarPonteiro);
      window.removeEventListener("pointercancel", aoSoltarPonteiro);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // Diálogo de "salvar antes de sair", com três respostas possíveis (não dá
  // pra fazer isso com o `useConfirmar` genérico, que só tem Confirmar/
  // Cancelar). `resolverSairRef` guarda a função que destrava a Promise que
  // `confirmarTrocaSeNecessario` está esperando.
  const [dialogSairAberto, setDialogSairAberto] = useState(false);
  const resolverSairRef = useRef<((resposta: "salvar" | "descartar" | "cancelar") => void) | null>(
    null,
  );

  function perguntarSobreSair(): Promise<"salvar" | "descartar" | "cancelar"> {
    return new Promise((resolve) => {
      resolverSairRef.current = resolve;
      setDialogSairAberto(true);
    });
  }

  function responderSair(resposta: "salvar" | "descartar" | "cancelar") {
    resolverSairRef.current?.(resposta);
    resolverSairRef.current = null;
    setDialogSairAberto(false);
  }

  /**
   * Chamado antes de qualquer ação que troque o documento em tela (abrir
   * outro texto, começar um novo, fechar a página). Se não há nada
   * arriscado a perder, deixa passar direto; se há, pergunta se o aluno
   * quer salvar, sair sem salvar, ou cancelar e continuar editando.
   */
  async function confirmarTrocaSeNecessario(): Promise<boolean> {
    const temConteudo = (areaRef.current?.innerText ?? "").trim().length > 0;
    if (!sujo || !temConteudo) return true;

    const resposta = await perguntarSobreSair();
    if (resposta === "cancelar") return false;
    if (resposta === "salvar") {
      if (!sessao) {
        toast.error("Entre na sua área de aluno para salvar o documento.");
        return false;
      }
      await salvar();
    }
    return true;
  }

  // Se o aluno tentar fechar a aba, atualizar a página ou sair pelo
  // navegador com mudanças não salvas, o próprio navegador mostra um aviso
  // nativo perguntando se ele quer mesmo sair.
  useEffect(() => {
    function aoTentarFecharAba(e: BeforeUnloadEvent) {
      if (!sujo) return;
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", aoTentarFecharAba);
    return () => window.removeEventListener("beforeunload", aoTentarFecharAba);
  }, [sujo]);

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
      prepararCaixasTexto();
      atualizarContagem();
      setSujo(true);
    }
    // Sem isso, cada Enter cria uma <div> nova com a margem padrão do
    // navegador (bem maior que o espaçamento entre linhas de um parágrafo de
    // verdade), e é isso que fazia o texto parecer com espaços enormes entre
    // as linhas depois de apertar Enter.
    document.execCommand("defaultParagraphSeparator", false, "p");
    carregarRecentes();
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
      prepararCaixasTexto();
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
                      <p className="mt-1 opacity-90">
                        Criado em {formatarDataHora(arquivo.criadoEm)}
                      </p>
                      <p className="opacity-90">
                        Atualizado em {formatarDataHora(arquivo.atualizadoEm)}
                      </p>
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
          <Button size="sm" className="h-8 gap-1.5" onClick={salvar} disabled={salvando}>
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
              <div className="absolute left-0 top-9 z-20 grid w-[148px] grid-cols-5 gap-1.5 rounded-lg border border-border bg-popover p-2 shadow-lg">
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
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={inserirCaixaTexto}
            title="Inserir caixa de texto arrastável"
          >
            <Square className="size-4" />
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
            onClick={aoClicarNaArea}
            className="relative mx-auto min-h-[500px] w-full max-w-[800px] rounded-sm bg-white p-6 text-sm text-[#1f2937] shadow-md focus:outline-none sm:p-16 [&_div]:mb-0 [&_div]:mt-0 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-sm [&_p]:mb-3 [&_p]:mt-0 [&_p]:indent-[1.25cm]"
            style={{ lineHeight: 1.6, fontFamily: "Calibri, Carlito, Arial, sans-serif" }}
            suppressContentEditableWarning
          />
        </div>

        {/* Barrinha flutuante que aparece quando uma imagem está selecionada,
          com as opções de posicionar em relação ao texto (como no Word) e
          de excluir a imagem. */}
        {imagemSelecionada && posicaoBarraImagem && (
          <div
            className="fixed z-30 flex items-center gap-0.5 rounded-lg border border-border bg-popover p-1 shadow-lg"
            style={{ top: posicaoBarraImagem.top, left: posicaoBarraImagem.left }}
          >
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              title="Em linha com o texto"
              onClick={() => aplicarAlinhamentoImagem("inline")}
            >
              <Type className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              title="Flutuar à esquerda (texto contorna à direita)"
              onClick={() => aplicarAlinhamentoImagem("esquerda")}
            >
              <PanelLeft className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              title="Centralizar"
              onClick={() => aplicarAlinhamentoImagem("centro")}
            >
              <AlignCenter className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              title="Flutuar à direita (texto contorna à esquerda)"
              onClick={() => aplicarAlinhamentoImagem("direita")}
            >
              <PanelRight className="size-3.5" />
            </Button>
            <div className="mx-0.5 h-5 w-px bg-border" />
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-destructive hover:bg-destructive/10"
              title="Excluir imagem"
              onClick={excluirImagemSelecionada}
            >
              <Trash2 className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              title="Fechar"
              onClick={desselecionarImagem}
            >
              <X className="size-3.5" />
            </Button>
          </div>
        )}

        <p className="text-right text-xs text-muted-foreground">
          {contagem} {contagem === 1 ? "palavra" : "palavras"} ·{" "}
          {sessao
            ? "salvo na sua pasta ao clicar em Salvar"
            : "salvo automaticamente neste computador"}{" "}
          ·{" "}
          <span className="text-muted-foreground/70">
            arraste a alcinha da imagem/caixa de texto para redimensionar
          </span>
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

      {/* Pergunta com três respostas ao tentar sair/trocar de documento com
          mudanças não salvas: salvar, sair sem salvar, ou cancelar. */}
      <Dialog open={dialogSairAberto} onOpenChange={(open) => !open && responderSair("cancelar")}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Salvar alterações?</DialogTitle>
            <DialogDescription>
              Este documento tem mudanças que ainda não foram salvas.{" "}
              {sessao
                ? "Deseja salvar antes de continuar?"
                : "Entre na sua área de aluno para salvar, ou continue sem salvar."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => responderSair("cancelar")}>
              Cancelar
            </Button>
            <Button
              variant="outline"
              className="text-destructive hover:bg-destructive/10"
              onClick={() => responderSair("descartar")}
            >
              Sair sem salvar
            </Button>
            {sessao && <Button onClick={() => responderSair("salvar")}>Salvar e continuar</Button>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
