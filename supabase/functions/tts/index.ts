// Edge Function: converte texto em áudio (voz natural) para o editor de
// texto e os jogos de alfabetização.
//
// Existe por um motivo só: a chave da API do Google Cloud Text-to-Speech
// não pode aparecer no navegador. Se ficasse no código do site, qualquer
// pessoa que abrisse o "Inspecionar" do navegador conseguiria copiá-la e
// usar por conta própria — e o consumo (e uma eventual cobrança, se passar
// da cota gratuita) cairia na conta de quem criou a chave. Aqui, a chave
// fica só no servidor (variável de ambiente `GOOGLE_TTS_API_KEY`, definida
// como "secret" do Supabase) e o navegador só conversa com esta função.
//
// Ver o README.md desta pasta para o passo a passo de configurar a chave e
// publicar esta função.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Voz "Wavenet" (rede neural do Google, bem mais natural que uma voz de
// robô comum) em português do Brasil. "B" é uma voz masculina; troque por
// "pt-BR-Wavenet-A" ou "pt-BR-Wavenet-C" para uma voz feminina.
const VOZ = "pt-BR-Wavenet-B";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Use POST." }), {
      status: 405,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  let corpo: { texto?: unknown; devagar?: unknown };
  try {
    corpo = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Corpo inválido." }), {
      status: 400,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  const texto = typeof corpo.texto === "string" ? corpo.texto.trim() : "";
  if (!texto) {
    return new Response(JSON.stringify({ error: "texto vazio" }), {
      status: 400,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
  // Nenhuma fala do editor/jogos passa perto disso — é só um limite de
  // segurança para não gastar cota com um pedido gigante por engano.
  const textoLimitado = texto.slice(0, 500);
  const devagar = corpo.devagar === true;

  const chave = Deno.env.get("GOOGLE_TTS_API_KEY");
  if (!chave) {
    // Configuração ainda não feita: o cliente cai sozinho na voz do
    // navegador quando recebe este erro (ver lib/voz.ts).
    return new Response(JSON.stringify({ error: "TTS não configurado (falta GOOGLE_TTS_API_KEY)" }), {
      status: 503,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  try {
    const resposta = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${chave}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: { text: textoLimitado },
          voice: { languageCode: "pt-BR", name: VOZ },
          audioConfig: {
            audioEncoding: "MP3",
            speakingRate: devagar ? 0.72 : 1,
          },
        }),
      },
    );

    if (!resposta.ok) {
      const detalhe = await resposta.text();
      return new Response(JSON.stringify({ error: `Google TTS: ${detalhe}` }), {
        status: 502,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const dados = (await resposta.json()) as { audioContent?: string };
    if (!dados.audioContent) {
      return new Response(JSON.stringify({ error: "Google TTS não devolveu áudio." }), {
        status: 502,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ audioBase64: dados.audioContent }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
