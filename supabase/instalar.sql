-- ============================================================
-- INSTALAÇÃO DO BANCO — Infoteca / Agenda de Informática
-- Escola Municipal em Tempo Integral Dr. Eiraldo Carneiro de França
--
-- COMO USAR: abra o painel do Supabase > SQL Editor > New query,
-- cole este arquivo inteiro e clique em RUN.
--
-- Pode rodar mais de uma vez sem problema: tudo aqui é "create if not
-- exists" ou "create or replace". Nada apaga dado existente.
--
-- São duas coisas independentes:
--   1. placares      — ranking dos jogos (público, só o primeiro nome)
--   2. trilha_aluno  — o que cada criança praticou (fechado, exige PIN)
-- ============================================================


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


-- Trilha do aluno: o registro do que a criança faz na Área do Aluno.
--
-- Rode este SQL uma vez no editor de SQL do Supabase. Enquanto a tabela não
-- existir, a Área do Aluno continua funcionando: os passos ficam no navegador
-- e a trilha avisa que ainda não está ligada ao banco (ver src/lib/trilha-aluno.ts).
--
-- Aqui há dado de criança, então a tabela é fechada: ninguém lê nem escreve
-- direto. Tudo passa pelas duas funções abaixo, que exigem o PIN do aluno —
-- o mesmo caminho que o histórico de acessos já usa.

create table if not exists public.trilha_aluno (
  id          uuid primary key default gen_random_uuid(),
  aluno_id    text        not null,
  turma_id    text        not null,
  ferramenta  text        not null,
  titulo      text,
  tipo        text        not null,
  pontos      integer,
  acertos     integer,
  total       integer,
  segundos    integer,
  criado_em   timestamptz not null default now(),

  constraint trilha_tipo_valido check (tipo in ('abriu', 'concluiu', 'pontuou', 'entregou')),
  constraint trilha_acertos_faixa check (acertos is null or total is null or acertos <= total),
  constraint trilha_segundos_faixa check (segundos is null or segundos between 0 and 86400)
);

create index if not exists trilha_aluno_idx on public.trilha_aluno (aluno_id, criado_em desc);
create index if not exists trilha_turma_idx on public.trilha_aluno (turma_id, criado_em desc);

alter table public.trilha_aluno enable row level security;

-- Sem policy nenhuma: a tabela fica inacessível pela API REST. Só as funções
-- abaixo, que rodam com security definer, entram aqui.

-- Grava um passo, depois de conferir o PIN direto em aluno_pins (a mesma
-- tabela que a função verificar_pin_aluno já usa).
create or replace function public.registrar_passo_aluno(
  p_aluno_id   text,
  p_turma_id   text,
  p_pin        text,
  p_ferramenta text,
  p_titulo     text,
  p_tipo       text,
  p_pontos     integer default null,
  p_acertos    integer default null,
  p_total      integer default null,
  p_segundos   integer default null
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.aluno_pins
    where aluno_id = p_aluno_id and pin = p_pin
  ) then
    return false;
  end if;

  insert into public.trilha_aluno
    (aluno_id, turma_id, ferramenta, titulo, tipo, pontos, acertos, total, segundos)
  values
    (p_aluno_id, p_turma_id, p_ferramenta, left(p_titulo, 80), p_tipo,
     p_pontos, p_acertos, p_total, p_segundos);

  return true;
end;
$$;

-- Devolve a trilha do próprio aluno, também mediante PIN.
create or replace function public.ler_trilha_aluno(
  p_aluno_id text,
  p_pin      text,
  p_limite   integer default 200
) returns table (
  ferramenta text,
  titulo     text,
  tipo       text,
  pontos     integer,
  acertos    integer,
  total      integer,
  segundos   integer,
  criado_em  timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.aluno_pins
    where aluno_id = p_aluno_id and pin = p_pin
  ) then
    return;
  end if;

  return query
    select t.ferramenta, t.titulo, t.tipo, t.pontos, t.acertos, t.total, t.segundos, t.criado_em
    from public.trilha_aluno t
    where t.aluno_id = p_aluno_id
    order by t.criado_em desc
    limit least(coalesce(p_limite, 200), 500);
end;
$$;

revoke all on function public.registrar_passo_aluno(
  text, text, text, text, text, text, integer, integer, integer, integer
) from public;
grant execute on function public.registrar_passo_aluno(
  text, text, text, text, text, text, integer, integer, integer, integer
) to anon, authenticated;

revoke all on function public.ler_trilha_aluno(text, text, integer) from public;
grant execute on function public.ler_trilha_aluno(text, text, integer) to anon, authenticated;
