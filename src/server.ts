import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

// WhatsApp, Facebook e LinkedIn só aceitam a imagem do cartão com endereço
// completo (https://…). As páginas declaram "/og/…"; aqui o caminho ganha o
// domínio de quem pediu, então vale tanto no domínio próprio quanto no
// endereço do Lovable. Só para os robôs que montam o cartão: o visitante
// comum segue recebendo a página em streaming, sem esperar o HTML inteiro.
const ROBO_DE_CARTAO =
  /facebookexternalhit|facebookcatalog|meta-externalagent|whatsapp|twitterbot|linkedinbot|telegrambot|slackbot|discordbot|pinterest|skypeuripreview|embedly|redditbot|applebot|googlebot|bingbot|bot\b|crawler|spider|preview/i;
const IMAGEM_RELATIVA =
  /(<meta\s+(?:property|name)="(?:og:image|twitter:image)"\s+content=")\/(?!\/)/g;

async function absolutizeShareImages(request: Request, response: Response): Promise<Response> {
  if (request.method !== "GET" || response.status !== 200) return response;
  if (!ROBO_DE_CARTAO.test(request.headers.get("user-agent") ?? "")) return response;
  if (!(response.headers.get("content-type") ?? "").includes("text/html")) return response;
  const html = await response.text();
  const origin = new URL(request.url).origin;
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  return new Response(html.replace(IMAGEM_RELATIVA, `$1${origin}/`), {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await absolutizeShareImages(request, await normalizeCatastrophicSsrResponse(response));
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
