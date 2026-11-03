import { useLocation } from "@tanstack/react-router";
import { useEffect } from "react";

/** Há alguma janela (diálogo, menu lateral, confirmação) aberta agora? */
function temJanelaAberta() {
  return Boolean(
    document.querySelector(
      '[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"], [data-tela-cheia]',
    ),
  );
}

/** Tira as travas que uma janela fechada deixou para trás. */
function destravar() {
  if (temJanelaAberta()) return;
  const body = document.body;
  if (body.style.pointerEvents === "none") body.style.pointerEvents = "";
  // A trava de rolagem das janelas usa este atributo; sem janela aberta ele
  // não deveria existir, e com ele a página fica parada e sem toque.
  if (body.hasAttribute("data-scroll-locked")) body.removeAttribute("data-scroll-locked");
  // Tela cheia da aula ou dos jogos que saiu sem devolver a rolagem.
  if (body.style.overflow === "hidden") body.style.overflow = "";
  const html = document.documentElement;
  if (html.style.overflow === "hidden") html.style.overflow = "";
  // Tela cheia nativa do navegador que ficou ligada sem nenhuma tela cheia aberta.
  if (document.fullscreenElement) void document.exitFullscreen?.().catch(() => undefined);
}

/**
 * Proteção contra a tela "travada" no celular: quando uma janela fecha ao
 * mesmo tempo em que a página troca (marcar turma, trocar horário, escolher
 * uma seção no menu "Mais"), o navegador às vezes fica com o toque desligado
 * e a rolagem presa, e o painel deixa de responder como aplicativo. Aqui,
 * sempre que isso acontece sem nenhuma janela aberta, as travas são tiradas.
 */
export function DestravarTela() {
  const { pathname } = useLocation();

  useEffect(() => {
    const id = window.setTimeout(destravar, 400);
    return () => window.clearTimeout(id);
  }, [pathname]);

  useEffect(() => {
    let espera: number | undefined;
    const observador = new MutationObserver(() => {
      window.clearTimeout(espera);
      // Dá tempo para a animação de fechar terminar antes de conferir.
      espera = window.setTimeout(destravar, 600);
    });
    observador.observe(document.body, {
      attributes: true,
      attributeFilter: ["style", "data-scroll-locked"],
      // Janelas que somem do <body> (portal removido) também contam.
      childList: true,
    });
    observador.observe(document.documentElement, { attributes: true, attributeFilter: ["style"] });
    return () => {
      observador.disconnect();
      window.clearTimeout(espera);
    };
  }, []);

  return null;
}
