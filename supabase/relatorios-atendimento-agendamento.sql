-- Relatórios consolidados do laboratório (horário de Rio Branco, UTC-5).
-- Executar no SQL Editor do Supabase da ESCOLA, não em outro projeto.
create extension if not exists pg_cron with schema pg_catalog;

create table if not exists public.relatorios_atendimento (
 id uuid primary key default gen_random_uuid(),
 periodo text not null check(periodo in ('semana','mes','ano')),
 data_inicio date not null,
 data_fim date not null,
 gerado_em timestamptz not null default now(),
 total_participacoes integer not null default 0,
 total_alunos integer not null default 0,
 total_turmas integer not null default 0,
 total_sessoes integer not null default 0,
 total_ausencias integer not null default 0,
 minutos_aluno numeric(14,2) not null default 0,
 turmas jsonb not null default '[]'::jsonb,
 unique(periodo,data_inicio,data_fim)
);
create index if not exists relatorios_atendimento_periodo_idx on public.relatorios_atendimento(periodo,data_fim desc);
alter table public.relatorios_atendimento enable row level security;
-- Sem políticas públicas. Permissões devem ser atribuídas a administradores da escola.
revoke all on public.relatorios_atendimento from anon, authenticated;

create or replace function public.consolidar_relatorio_atendimento(p_periodo text, p_inicio date, p_fim date)
returns void language plpgsql security invoker set search_path = public, pg_temp as $$
begin
 if p_periodo not in ('semana','mes','ano') or p_inicio>p_fim then
   raise exception 'Período inválido';
 end if;
 insert into public.relatorios_atendimento(
 periodo,data_inicio,data_fim,gerado_em,total_participacoes,total_alunos,total_turmas,
 total_sessoes,total_ausencias,minutos_aluno,turmas
 )
 with base as (
   select * from public.laboratorio_sessoes where data between p_inicio and p_fim
 ), presencas as (
   select * from base where ausencia is null and coalesce(sem_marcacao,false)=false
 ), por_turma as (
   select turma_id,max(turma_rotulo) as turma,count(*) as participacoes,
     count(distinct aluno_id) as alunos
   from presencas group by turma_id
 )
 select p_periodo,p_inicio,p_fim,now(),
   (select count(*) from presencas),
   (select count(distinct (turma_id,aluno_id)) from presencas),
   (select count(distinct turma_id) from presencas),
   (select count(distinct grupo_id) from presencas),
   (select count(*) from base where ausencia is not null or coalesce(sem_marcacao,false)),
   (select coalesce(sum(greatest(0,extract(epoch from (fim-inicio))/60-coalesce(pausa_segundos,0)/60.0)),0) from presencas),
   (select coalesce(jsonb_agg(jsonb_build_object('turma',turma,'participacoes',participacoes,'alunos',alunos) order by turma),'[]'::jsonb) from por_turma)
 on conflict(periodo,data_inicio,data_fim) do update set
 gerado_em=excluded.gerado_em,total_participacoes=excluded.total_participacoes,
 total_alunos=excluded.total_alunos,total_turmas=excluded.total_turmas,
 total_sessoes=excluded.total_sessoes,total_ausencias=excluded.total_ausencias,
 minutos_aluno=excluded.minutos_aluno,turmas=excluded.turmas;
end $$;
revoke all on function public.consolidar_relatorio_atendimento(text,date,date) from public,anon,authenticated;

-- Agendamento em UTC: sexta 20:00 UTC = sexta 15:00 no Acre.
-- Um minuto de margem para garantir que os registros das 15h estejam persistidos.
select cron.unschedule(jobid) from cron.job where jobname='informatica-fechamento-semanal';
select cron.schedule(
 'informatica-fechamento-semanal','1 20 * * 5',
 $job$
 select public.consolidar_relatorio_atendimento(
   'semana',
   ((now() at time zone 'America/Rio_Branco')::date -
    ((extract(isodow from now() at time zone 'America/Rio_Branco')::int)-1)),
   (now() at time zone 'America/Rio_Branco')::date
 );
 $job$
);
-- Nota: esta consolidação semanal inclui segunda a sexta, sem sábado/domingo.
-- Para relatórios históricos mensais/anuais, usar a visão dinâmica no painel.
