-- ============================================================
-- LABORATÓRIO — quem está (e quem já foi) ao laboratório de informática
-- Escola Municipal em Tempo Integral Dr. Eiraldo Carneiro de França
--
-- COMO USAR: abra o painel do Supabase > SQL Editor > New query,
-- cole este arquivo inteiro e clique em RUN. Rode uma vez.
--
-- Pode rodar mais de uma vez sem problema: tudo aqui é "create if not
-- exists" ou "drop policy if exists". Nada apaga dado existente.
--
-- O que ele guarda: cada linha é UM aluno marcado pelo professor para ir ao
-- laboratório, com a hora de início e de fim. É daí que o painel da home
-- mostra "no laboratório agora" e que o sistema conta quantas vezes cada
-- aluno foi na semana e no mês.
--
-- Quem lê: qualquer visitante (a home mostra quem está no laboratório).
-- Quem grava, altera e apaga: só quem está logado no painel de gestão.
-- ============================================================

create table if not exists public.laboratorio_sessoes (
  id           uuid primary key default gen_random_uuid(),
  -- Dia letivo no horário de Rio Branco (YYYY-MM-DD). Guardado à parte para
  -- contar semana e mês sem depender de fuso.
  data         date        not null,
  -- Alunos marcados juntos, no mesmo clique, formam um grupo.
  grupo_id     uuid        not null default gen_random_uuid(),
  turma_id     text        not null,
  turma_rotulo text        not null,
  aluno_id     text        not null,
  aluno_nome   text        not null,
  inicio       timestamptz not null,
  fim          timestamptz not null,
  criado_em    timestamptz not null default now(),
  criado_por   text,

  constraint laboratorio_fim_depois_do_inicio check (fim > inicio),
  -- Trava de segurança contra erro de digitação: nenhuma marcação passa de 4 h.
  constraint laboratorio_duracao_maxima check (fim - inicio <= interval '4 hours'),
  constraint laboratorio_nome_tamanho check (char_length(aluno_nome) between 1 and 120)
);

create index if not exists laboratorio_sessoes_data_idx
  on public.laboratorio_sessoes (data);

create index if not exists laboratorio_sessoes_aluno_idx
  on public.laboratorio_sessoes (aluno_id, data);

create index if not exists laboratorio_sessoes_turma_idx
  on public.laboratorio_sessoes (turma_id, data);

alter table public.laboratorio_sessoes enable row level security;

-- Leitura aberta: a home pública mostra quem está no laboratório agora.
drop policy if exists "laboratorio: leitura publica" on public.laboratorio_sessoes;
create policy "laboratorio: leitura publica"
  on public.laboratorio_sessoes for select
  to anon, authenticated
  using (true);

-- Só o painel de gestão (usuário logado) marca, ajusta e remove.
drop policy if exists "laboratorio: gestao insere" on public.laboratorio_sessoes;
create policy "laboratorio: gestao insere"
  on public.laboratorio_sessoes for insert
  to authenticated
  with check (true);

drop policy if exists "laboratorio: gestao altera" on public.laboratorio_sessoes;
create policy "laboratorio: gestao altera"
  on public.laboratorio_sessoes for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "laboratorio: gestao apaga" on public.laboratorio_sessoes;
create policy "laboratorio: gestao apaga"
  on public.laboratorio_sessoes for delete
  to authenticated
  using (true);

-- ============================================================
-- PAUSAR E PARAR A AULA (acrescentado depois)
-- pausado_em: quando a aula foi pausada (null = rodando).
-- pausa_segundos: soma das pausas já encerradas.
-- motivo_parada: justificativa de quem parou a aula antes da hora.
-- O limite de duração sobe para 8 h porque a pausa empurra o horário de fim.
-- ============================================================
alter table public.laboratorio_sessoes
  add column if not exists pausado_em     timestamptz,
  add column if not exists pausa_segundos integer not null default 0,
  add column if not exists motivo_parada  text;

alter table public.laboratorio_sessoes
  drop constraint if exists laboratorio_duracao_maxima;
alter table public.laboratorio_sessoes
  add constraint laboratorio_duracao_maxima check (fim - inicio <= interval '8 hours');

-- ============================================================
-- FALTA E NÃO AUTORIZAÇÃO (acrescentado depois)
-- ausencia: o aluno foi marcado mas não ficou no laboratório:
--   'faltou' (não veio) ou 'nao_autorizado' (o professor não liberou).
-- ausencia_motivo: por que o professor não autorizou.
-- A marcação fica guardada, mas não conta como ida.
-- ============================================================
alter table public.laboratorio_sessoes
  add column if not exists ausencia        text,
  add column if not exists ausencia_motivo text;

alter table public.laboratorio_sessoes
  drop constraint if exists laboratorio_ausencia_valida;
alter table public.laboratorio_sessoes
  add constraint laboratorio_ausencia_valida
  check (ausencia is null or ausencia in ('faltou', 'nao_autorizado'));
