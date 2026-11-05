-- Acompanhamento persistente dos planos de intervenção de leitura e escrita.
-- Execute uma única vez no SQL Editor do mesmo projeto Supabase da aplicação.

create table if not exists public.planos_intervencao_leitura_escrita (
  id uuid primary key default gen_random_uuid(),
  avaliacao_id uuid not null references public.avaliacoes_leitura_escrita(id) on delete cascade,
  turma_id text not null,
  aluno_id text not null,
  aluno_nome text not null,
  area text not null check (area in ('leitura','escrita')),
  habilidade_key text not null,
  habilidade text not null,
  nivel_base smallint not null check (nivel_base between 1 and 2),
  objetivo text not null,
  atividade_sugerida text not null,
  rotina_sugerida text not null,
  evidencia_esperada text not null,
  status text not null default 'planejado'
    check (status in ('planejado','em_andamento','concluido','reavaliar')),
  data_inicio date,
  data_revisao date,
  atividades jsonb not null default '[]'::jsonb
    check (jsonb_typeof(atividades) = 'array'),
  criado_por uuid not null default auth.uid() references auth.users(id) on delete restrict,
  atualizado_em timestamptz not null default now(),
  criado_em timestamptz not null default now(),
  constraint planos_intervencao_unicos unique (avaliacao_id, area, habilidade_key)
);

create index if not exists planos_intervencao_aluno_idx
  on public.planos_intervencao_leitura_escrita (aluno_id, criado_em desc);
create index if not exists planos_intervencao_turma_status_idx
  on public.planos_intervencao_leitura_escrita (turma_id, status, data_revisao);

alter table public.planos_intervencao_leitura_escrita enable row level security;
revoke all on public.planos_intervencao_leitura_escrita from anon;
grant select, insert, update on public.planos_intervencao_leitura_escrita to authenticated;

drop policy if exists "planos_intervencao_select_autenticado" on public.planos_intervencao_leitura_escrita;
create policy "planos_intervencao_select_autenticado"
  on public.planos_intervencao_leitura_escrita for select to authenticated
  using (true);

drop policy if exists "planos_intervencao_insert_autor" on public.planos_intervencao_leitura_escrita;
create policy "planos_intervencao_insert_autor"
  on public.planos_intervencao_leitura_escrita for insert to authenticated
  with check (criado_por = (select auth.uid()));

drop policy if exists "planos_intervencao_update_autor" on public.planos_intervencao_leitura_escrita;
create policy "planos_intervencao_update_autor"
  on public.planos_intervencao_leitura_escrita for update to authenticated
  using (criado_por = (select auth.uid()))
  with check (criado_por = (select auth.uid()));

comment on table public.planos_intervencao_leitura_escrita is
  'Planos individuais de intervenção pedagógica, vinculados à avaliação que originou cada habilidade prioritária.';
