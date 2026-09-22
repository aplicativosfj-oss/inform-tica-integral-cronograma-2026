-- Ranking dos jogos da Infoteca (Desafio das 4 operações e os que vierem).
--
-- Rode este SQL uma vez no editor de SQL do Supabase. Enquanto a tabela não
-- existir, os jogos continuam funcionando: o placar fica guardado só no
-- navegador do computador que jogou (ver src/lib/placares.ts).
--
-- Por que é seguro deixar qualquer visitante inserir: o placar não tem dado
-- pessoal além do primeiro nome que a criança digita, ninguém pode alterar
-- nem apagar o que já foi gravado, e o jogo é aberto ao público por decisão
-- da escola. Se um dia aparecer nome improprio, a equipe apaga pelo painel
-- do Supabase.

create table if not exists public.placares (
  id          uuid primary key default gen_random_uuid(),
  jogo        text        not null,
  aluno       text        not null,
  turma       text,
  pontos      integer     not null default 0,
  acertos     integer     not null default 0,
  total       integer     not null default 0,
  nivel       text,
  segundos    integer,
  criado_em   timestamptz not null default now(),

  -- Barreiras contra lixo: nome curto, pontuação dentro do possível.
  constraint placares_aluno_tamanho check (char_length(aluno) between 1 and 40),
  constraint placares_turma_tamanho check (turma is null or char_length(turma) <= 20),
  constraint placares_pontos_faixa  check (pontos between 0 and 100000),
  constraint placares_acertos_faixa check (acertos >= 0 and acertos <= total)
);

create index if not exists placares_jogo_pontos_idx
  on public.placares (jogo, pontos desc);

create index if not exists placares_turma_idx
  on public.placares (jogo, turma, pontos desc);

alter table public.placares enable row level security;

-- Qualquer um lê o ranking (é o objetivo dele).
drop policy if exists "placares: leitura publica" on public.placares;
create policy "placares: leitura publica"
  on public.placares for select
  to anon, authenticated
  using (true);

-- Qualquer um grava o próprio placar, mas ninguém edita nem apaga:
-- sem policy de update/delete, o Postgres recusa as duas operações.
drop policy if exists "placares: insercao publica" on public.placares;
create policy "placares: insercao publica"
  on public.placares for insert
  to anon, authenticated
  with check (true);
