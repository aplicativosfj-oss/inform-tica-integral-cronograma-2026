-- Avaliação contínua individual de leitura e escrita.
-- Não altera nem reclassifica os dados históricos da avaliação diagnóstica.
-- Execute no SQL Editor do projeto Supabase usado pelo site.

create table if not exists public.avaliacoes_leitura_escrita (
  id uuid primary key default gen_random_uuid(),
  turma_id text not null,
  aluno_id text not null,
  aluno_nome text not null,
  ano smallint not null check (ano between 1 and 9),
  bimestre smallint not null check (bimestre between 1 and 4),
  data_avaliacao date not null,
  titulo text not null check (char_length(trim(titulo)) between 1 and 180),
  criterios jsonb not null default '{"leitura":{},"escrita":{}}'::jsonb,
  observacoes text,
  evidencia text,
  avaliador_id uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint avaliacao_leitura_escrita_criterios_objeto
    check (jsonb_typeof(criterios) = 'object'),
  constraint avaliacao_leitura_escrita_leitura_objeto
    check (jsonb_typeof(coalesce(criterios->'leitura', '{}'::jsonb)) = 'object'),
  constraint avaliacao_leitura_escrita_escrita_objeto
    check (jsonb_typeof(coalesce(criterios->'escrita', '{}'::jsonb)) = 'object')
);

create index if not exists avaliacoes_leitura_escrita_turma_bimestre_idx
  on public.avaliacoes_leitura_escrita (turma_id, bimestre, data_avaliacao desc);
create index if not exists avaliacoes_leitura_escrita_aluno_idx
  on public.avaliacoes_leitura_escrita (aluno_id, data_avaliacao desc);

alter table public.avaliacoes_leitura_escrita enable row level security;
revoke all on public.avaliacoes_leitura_escrita from anon;
grant select, insert, update on public.avaliacoes_leitura_escrita to authenticated;

drop policy if exists "avaliacoes_leitura_escrita_admin_select" on public.avaliacoes_leitura_escrita;
create policy "avaliacoes_leitura_escrita_admin_select"
  on public.avaliacoes_leitura_escrita for select to authenticated
  using (true);

drop policy if exists "avaliacoes_leitura_escrita_admin_insert" on public.avaliacoes_leitura_escrita;
create policy "avaliacoes_leitura_escrita_admin_insert"
  on public.avaliacoes_leitura_escrita for insert to authenticated
  with check (avaliador_id = (select auth.uid()));

drop policy if exists "avaliacoes_leitura_escrita_admin_update" on public.avaliacoes_leitura_escrita;
create policy "avaliacoes_leitura_escrita_admin_update"
  on public.avaliacoes_leitura_escrita for update to authenticated
  using (avaliador_id = (select auth.uid()))
  with check (avaliador_id = (select auth.uid()));

comment on table public.avaliacoes_leitura_escrita is
  'Rubricas individuais de leitura e produção escrita, com bimestre e data explicitamente informados pelo professor.';
