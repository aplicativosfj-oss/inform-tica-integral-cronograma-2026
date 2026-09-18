import { createServerFn } from "@tanstack/react-start";

// ID da estação "Jovem Pan FM 100.9" no TuneIn (tunein.com/radio/Jovem-Pan-FM-1009-s122944).
const TUNEIN_STATION_ID = "s122944";

/**
 * O link de stream do TuneIn/Zeno.fm carrega um token temporário
 * (`partnertok`) que expira depois de um tempo — não dá pra fixar no
 * código. Essa função roda no servidor (sem bloqueio de CORS do navegador)
 * e busca um link fresco toda vez que o ouvinte aperta play.
 */
export const fetchRadioStreamUrl = createServerFn({ method: "GET" }).handler(async () => {
  const res = await fetch(
    `https://opml.radiotime.com/Tune.ashx?id=${TUNEIN_STATION_ID}&render=json`,
  );
  if (!res.ok) throw new Error(`TuneIn respondeu ${res.status}`);
  const data = (await res.json()) as { body?: Array<{ url?: string }> };
  const url = data.body?.[0]?.url;
  if (!url) throw new Error("TuneIn não retornou uma URL de stream");
  return url;
});
