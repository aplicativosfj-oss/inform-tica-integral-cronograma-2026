-- Anotações individuais do laboratório. Execute no Supabase da escola.
create table if not exists public.anotacoes_aluno_laboratorio (
 id uuid primary key default gen_random_uuid(),
 aluno_id text not null,
 aluno_nome text not null,
 turma_id text not null,
 turma_rotulo text not null,
 sessao_id uuid references public.laboratorio_sessoes(id) on delete set null,
 tipo text not null check(tipo in ('observacao','elogio','comportamento','impedimento')),
 descricao text not null check(char_length(trim(descricao)) between 10 and 3000),
 registrado_por uuid not null references auth.users(id),
 criado_em timestamptz not null default now()
);
create index if not exists anotacoes_aluno_laboratorio_idx on public.anotacoes_aluno_laboratorio(turma_id,aluno_id,criado_em desc);
alter table public.anotacoes_aluno_laboratorio enable row level security;
revoke all on public.anotacoes_aluno_laboratorio from anon;
grant select,insert on public.anotacoes_aluno_laboratorio to authenticated;
drop policy if exists "anotacoes: leitura autenticada" on public.anotacoes_aluno_laboratorio;
create policy "anotacoes: leitura autenticada" on public.anotacoes_aluno_laboratorio for select to authenticated using (auth.uid() is not null);
drop policy if exists "anotacoes: insercao autenticada" on public.anotacoes_aluno_laboratorio;
create policy "anotacoes: insercao autenticada" on public.anotacoes_aluno_laboratorio for insert to authenticated with check (auth.uid() is not null and registrado_por=auth.uid());
-- Anotações não podem ser apagadas nem alteradas pela interface.
-- ATENÇÃO: a política antiga da tabela laboratorio_sessoes permite UPDATE a todos
-- os autenticados. Revise os papéis de acesso se nem todos os cadastrados devem gerir aulas.
