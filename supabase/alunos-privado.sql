-- Dados pessoais dos alunos só para administradores (login do painel).
--
-- O cadastro das turmas (app_state.turmas) é lido pelo site público. Este SQL
-- cria a tabela alunos_privado, que só quem está logado lê e grava, MOVE para
-- ela o INEP, a data de nascimento, o endereço e as anotações de cada aluno e
-- tira esses campos do cadastro público. No público fica só o dia e o mês do
-- aniversário ("aniversario": "MM-DD"), para o selo de aniversariante.
--
-- Rode tudo de uma vez no SQL Editor do Supabase (projeto AGENDA EDUCATIVA).
-- Pode rodar de novo sem problema. Feche as abas do painel antes.

create table if not exists public.alunos_privado (
  turma_id   text not null,
  aluno_id   text not null,
  inep       text,
  nascimento text,
  endereco   text,
  anotacoes  jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (turma_id, aluno_id)
);

alter table public.alunos_privado enable row level security;
revoke all on public.alunos_privado from anon;
grant select, insert, update, delete on public.alunos_privado to authenticated;

-- Sem policy para "anon": o site público não consegue ler nada daqui.
drop policy if exists "alunos_privado: admin le" on public.alunos_privado;
create policy "alunos_privado: admin le"
  on public.alunos_privado for select to authenticated using (true);

drop policy if exists "alunos_privado: admin insere" on public.alunos_privado;
create policy "alunos_privado: admin insere"
  on public.alunos_privado for insert to authenticated with check (true);

drop policy if exists "alunos_privado: admin altera" on public.alunos_privado;
create policy "alunos_privado: admin altera"
  on public.alunos_privado for update to authenticated using (true) with check (true);

drop policy if exists "alunos_privado: admin apaga" on public.alunos_privado;
create policy "alunos_privado: admin apaga"
  on public.alunos_privado for delete to authenticated using (true);

-- 1) Copia os dados pessoais que estão no cadastro público para a tabela.
--    O que já estiver na tabela só é completado, nunca trocado.
insert into public.alunos_privado (turma_id, aluno_id, inep, nascimento, endereco, anotacoes)
select t->>'id', a->>'id',
       nullif(a->>'inep', ''), nullif(a->>'nascimento', ''), nullif(a->>'endereco', ''),
       coalesce(a->'anotacoes', '[]'::jsonb)
from public.app_state s,
     jsonb_array_elements(s.turmas) t,
     jsonb_array_elements(coalesce(t->'alunos', '[]'::jsonb)) a
where s.id = 'default'
  and (coalesce(a->>'inep', '') <> '' or coalesce(a->>'nascimento', '') <> ''
       or coalesce(a->>'endereco', '') <> ''
       or jsonb_array_length(coalesce(a->'anotacoes', '[]'::jsonb)) > 0)
on conflict (turma_id, aluno_id) do update set
  inep       = coalesce(alunos_privado.inep, excluded.inep),
  nascimento = coalesce(alunos_privado.nascimento, excluded.nascimento),
  endereco   = coalesce(alunos_privado.endereco, excluded.endereco),
  anotacoes  = case when jsonb_array_length(alunos_privado.anotacoes) > 0
                    then alunos_privado.anotacoes else excluded.anotacoes end,
  updated_at = now();

-- 2) Tira esses campos do cadastro público e deixa só o dia/mês do aniversário.
update public.app_state s set turmas = (
  select jsonb_agg(
    case when t ? 'alunos' then jsonb_set(t, '{alunos}', (
      select coalesce(jsonb_agg(
        (a - 'inep' - 'nascimento' - 'endereco' - 'anotacoes' - 'aniversario')
        || case when coalesce(a->>'nascimento', '') ~ '^\d{4}-\d{2}-\d{2}$'
                then jsonb_build_object('aniversario', substring(a->>'nascimento' from 6 for 5))
                when a ? 'aniversario' then jsonb_build_object('aniversario', a->'aniversario')
                else '{}'::jsonb end
        order by ord), '[]'::jsonb)
      from jsonb_array_elements(t->'alunos') with ordinality as x(a, ord)
    )) else t end
    order by tord)
  from jsonb_array_elements(s.turmas) with ordinality as y(t, tord)
), updated_at = now()
where s.id = 'default';

-- 3) Conferência: a primeira coluna deve dar 0; a segunda, quantos alunos
--    têm dados guardados só para administradores.
select
  (select count(*)
     from public.app_state s, jsonb_array_elements(s.turmas) t,
          jsonb_array_elements(coalesce(t->'alunos', '[]'::jsonb)) a
    where s.id = 'default'
      and (a ? 'inep' or a ? 'nascimento' or a ? 'endereco' or a ? 'anotacoes'))
    as dados_pessoais_no_publico,
  (select count(*) from public.alunos_privado) as alunos_com_dados_privados;
