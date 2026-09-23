# Voz natural (Google Cloud Text-to-Speech)

Esta função faz o editor de texto e os jogos de alfabetização falarem com
uma voz de nuvem bem mais natural (Google "Wavenet") em vez da voz robótica
do navegador. Enquanto ela não estiver configurada, **nada quebra**: o site
continua funcionando normalmente com a voz do navegador (a que já foi
melhorada antes).

A cota gratuita do Google Cloud TTS para vozes Wavenet é de **1 milhão de
caracteres por mês** — folgado para uma escola: cada "sílaba" ou "letra"
falada tem só 1 a 3 caracteres.

## Passo 1 — Criar a chave da API no Google Cloud

1. Entre em [console.cloud.google.com](https://console.cloud.google.com/)
   com uma conta Google (pode ser a mesma do Gmail da escola).
2. Crie um projeto novo (canto superior, "Select a project" → "New Project").
   Você vai precisar cadastrar um cartão de crédito para ativar a conta
   gratuita do Google Cloud — **não é cobrado nada** enquanto o uso ficar
   dentro da cota gratuita mensal, mas o cartão é exigido pelo Google como
   verificação.
3. No menu, vá em **APIs e serviços → Biblioteca**, procure por
   "Cloud Text-to-Speech API" e clique em **Ativar**.
4. Vá em **APIs e serviços → Credenciais → Criar credenciais → Chave de
   API**. Copie a chave gerada (uma sequência de letras e números).
5. Recomendado: clique na chave recém-criada → **Restringir chave** → em
   "Restrições de API" escolha **Cloud Text-to-Speech API** apenas. Isso
   impede que, mesmo vazada, a chave sirva para outra coisa.

## Passo 2 — Guardar a chave no Supabase (sem publicar no site)

No painel do Supabase do projeto (o mesmo onde está o banco de dados):

1. Vá em **Edge Functions** no menu lateral.
2. Se a função `tts` ainda não existir, clique em **Deploy a new function**,
   dê o nome `tts` e cole o conteúdo do arquivo `index.ts` desta pasta.
3. Vá em **Project Settings → Edge Functions → Secrets** (ou "Manage
   secrets" na própria tela de Edge Functions) e adicione:
   - Nome: `GOOGLE_TTS_API_KEY`
   - Valor: a chave copiada no Passo 1.
4. Publique/reinicie a função para ela ler o novo secret.

### Alternativa via linha de comando (se preferir)

Se tiver o [Supabase CLI](https://supabase.com/docs/guides/cli) instalado e
já logado (`supabase login`) e linkado a este projeto (`supabase link`):

```bash
supabase secrets set GOOGLE_TTS_API_KEY=SUA_CHAVE_AQUI
supabase functions deploy tts
```

## Passo 3 — Testar

Abra o Editor de texto ou o Parque das Letras no site e clique em qualquer
botão de "ouvir". Se a voz saiu natural (não mais robótica), está
funcionando. Se continuar na voz antiga, veja os logs da função no painel
do Supabase (**Edge Functions → tts → Logs**) — o erro mais comum é a chave
não ter sido salva com o nome exato `GOOGLE_TTS_API_KEY`.

## Trocar a voz

O arquivo `index.ts` usa `pt-BR-Wavenet-B` (voz masculina). Para trocar,
edite a constante `VOZ` no topo do arquivo. Outras opções em português do
Brasil: `pt-BR-Wavenet-A` e `pt-BR-Wavenet-C` (femininas). A lista completa
está em
[cloud.google.com/text-to-speech/docs/voices](https://cloud.google.com/text-to-speech/docs/voices).
