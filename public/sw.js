const CACHE_NAME = "agenda-informatica-v3";
const APP_SHELL = [
  "/",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

const HOSTS_FONTES = ["fonts.googleapis.com", "fonts.gstatic.com"];

self.addEventListener("install", (event) => {
  // Tolerante: se um item do shell falhar (rede ruim na instalação), o
  // service worker ainda assim é instalado e o resto entra no cache depois.
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => Promise.allSettled(APP_SHELL.map((url) => cache.add(url))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

// Guarda no cache uma URL e devolve a resposta (ou null se falhar).
async function guardar(cache, url, opcoes) {
  try {
    const resposta = await fetch(url, opcoes);
    if (resposta && (resposta.ok || resposta.type === "opaque")) {
      await cache.put(url, resposta.clone());
      return resposta;
    }
  } catch {
    // Sem rede agora: fica para a próxima vez que o site abrir online.
  }
  return null;
}

// Pré-carrega páginas (e os arquivos que elas usam) para funcionarem offline.
async function precarregar(urls, fontesCss) {
  const cache = await caches.open(CACHE_NAME);

  for (const url of urls) {
    const resposta = await guardar(cache, url, { credentials: "same-origin" });
    if (!resposta) continue;
    const tipo = resposta.headers.get("content-type") || "";
    if (!tipo.includes("text/html")) continue;

    const html = await resposta.clone().text();
    const assets = new Set(html.match(/\/assets\/[^"'\s)<>]+/g) || []);
    for (const asset of assets) {
      if (!(await cache.match(asset))) await guardar(cache, asset);
    }
  }

  if (fontesCss) {
    const css = await guardar(cache, fontesCss, { mode: "cors" });
    if (css) {
      const texto = await css.clone().text();
      const arquivos = new Set(texto.match(/https:\/\/fonts\.gstatic\.com\/[^)'"\s]+/g) || []);
      for (const arquivo of arquivos) {
        if (!(await cache.match(arquivo))) await guardar(cache, arquivo, { mode: "cors" });
      }
    }
  }
}

self.addEventListener("message", (event) => {
  const dados = event.data;
  if (!dados || dados.type !== "PRECARREGAR" || !Array.isArray(dados.urls)) return;
  event.waitUntil(precarregar(dados.urls, dados.fontesCss));
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Fontes do Google: mostra a do cache e atualiza em segundo plano.
  if (HOSTS_FONTES.includes(url.hostname)) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        const rede = fetch(request)
          .then((response) => {
            if (response && (response.ok || response.type === "opaque")) {
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() => cached);
        return cached || rede;
      }),
    );
    return;
  }

  if (url.origin !== self.location.origin) return;

  // Content-hashed build assets and icons: safe to serve straight from cache.
  if (url.pathname.startsWith("/assets/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        });
      }),
    );
    return;
  }

  // Page navigations: network-first (so admin data stays fresh), falling back
  // to the cached page, then to the app shell, so the interface (e.g. the
  // Sala de Jogos) still opens in the lab even without a connection.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() =>
          caches
            .match(request, { ignoreSearch: true })
            .then((cached) => cached || caches.match("/")),
        ),
    );
  }
});
