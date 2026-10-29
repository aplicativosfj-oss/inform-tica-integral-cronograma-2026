-- 4º Ano "A": a professora regente é Edivânia.
-- Atualiza a turma t-4a dentro de app_state.turmas (linha 'default').
update public.app_state
set turmas = (
  select jsonb_agg(
    case when t->>'id' = 't-4a'
      then jsonb_set(t, '{professorRegente}', '"Edivânia"')
      else t
    end
    order by ord
  )
  from jsonb_array_elements(turmas) with ordinality as x(t, ord)
)
where id = 'default';

-- Conferir:
select t->>'id' as turma, t->>'professorRegente' as regente
from public.app_state, jsonb_array_elements(turmas) t
where id = 'default' and t->>'id' = 't-4a';
