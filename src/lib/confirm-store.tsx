import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PedidoConfirmacao {
  titulo: string;
  descricao: string;
  textoConfirmar?: string;
  destrutivo?: boolean;
}

type ConfirmarFn = (pedido: PedidoConfirmacao) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmarFn | null>(null);

/**
 * Painel administrativo: toda alteração passa por aqui antes de ser
 * aplicada. Um único diálogo reutilizável, montado uma vez na raiz do
 * painel — cada tela só chama `confirmar({ titulo, descricao })` e recebe
 * `true`/`false` de volta, sem precisar de um <AlertDialog> próprio.
 */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pedido, setPedido] = useState<PedidoConfirmacao | null>(null);
  const resolveRef = useRef<((valor: boolean) => void) | null>(null);

  const confirmar = useCallback<ConfirmarFn>((novoPedido) => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setPedido(novoPedido);
    });
  }, []);

  function responder(valor: boolean) {
    resolveRef.current?.(valor);
    resolveRef.current = null;
    setPedido(null);
  }

  return (
    <ConfirmContext.Provider value={confirmar}>
      {children}
      <AlertDialog open={pedido !== null} onOpenChange={(open) => !open && responder(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{pedido?.titulo}</AlertDialogTitle>
            <AlertDialogDescription>{pedido?.descricao}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => responder(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className={
                pedido?.destrutivo
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : undefined
              }
              onClick={() => responder(true)}
            >
              {pedido?.textoConfirmar ?? "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  );
}

/**
 * `await confirmar({ titulo, descricao })` — mostra o diálogo e resolve
 * `true` só se o administrador confirmar. Use antes de qualquer chamada que
 * altere dados no painel.
 */
export function useConfirmar() {
  const confirmar = useContext(ConfirmContext);
  if (!confirmar) throw new Error("useConfirmar must be used within ConfirmProvider");
  return confirmar;
}
