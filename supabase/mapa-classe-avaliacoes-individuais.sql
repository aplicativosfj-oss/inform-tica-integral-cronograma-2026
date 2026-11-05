-- Registros individuais do Mapa de Classe (dados de crianças: acesso autenticado).
-- A planilha agregada atual não contém nomes; esta tabela recebe os registros individuais
-- importados de uma fonte autorizada ou cadastrados pela equipe pedagógica.

create table if not exists public.mapa_classe_avaliacoes_individuais (
  id uuid primary key default gen_random_uuid(),
  aluno_id text not null,
  aluno_nome text not null,
  ano smallint not null check (ano between 1 and 5),
  turma text not null check (turma in ('A','B')),
  bimestre smallint not null check (bimestre between 1 and 4),
  area text not null check (area in ('leitura','escrita')),
  nivel text not null check (nivel in ('A','B','C','C1','C2','C3','D','E')),
  data_avaliacao date,
  observacoes text,
  evidencia text,
  avaliador_id uuid not null default auth.uid() references auth.users(id) on delete restrict,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint mapa_classe_aluno_nivel_unico unique (aluno_id, bimestre, area)
);

create index if not exists mapa_classe_individual_turma_idx
  on public.mapa_classe_avaliacoes_individuais (ano, turma, bimestre, area, nivel);
create index if not exists mapa_classe_individual_aluno_idx
  on public.mapa_classe_avaliacoes_individuais (aluno_id, bimestre desc);

alter table public.mapa_classe_avaliacoes_individuais enable row level security;
revoke all on public.mapa_classe_avaliacoes_individuais from anon;
grant select, insert, update on public.mapa_classe_avaliacoes_individuais to authenticated;

drop policy if exists "mapa_classe_individual_select_autenticado" on public.mapa_classe_avaliacoes_individuais;
create policy "mapa_classe_individual_select_autenticado"
  on public.mapa_classe_avaliacoes_individuais for select to authenticated
  using (true);

drop policy if exists "mapa_classe_individual_insert_autor" on public.mapa_classe_avaliacoes_individuais;
create policy "mapa_classe_individual_insert_autor"
  on public.mapa_classe_avaliacoes_individuais for insert to authenticated
  with check (avaliador_id = (select auth.uid()));

drop policy if exists "mapa_classe_individual_update_autor" on public.mapa_classe_avaliacoes_individuais;
create policy "mapa_classe_individual_update_autor"
  on public.mapa_classe_avaliacoes_individuais for update to authenticated
  using (avaliador_id = (select auth.uid()))
  with check (avaliador_id = (select auth.uid()));

comment on table public.mapa_classe_avaliacoes_individuais is
  'Níveis individuais do Mapa de Classe; não expor em páginas públicas.';
