-- Lembretes do laboratório: além das anotações já existentes, o professor
-- precisa registrar que um aluno pediu para sair antes do fim da aula --
-- ocupou o computador e deixou o colega de fora. Esse registro é o que faz
-- a marca amarela aparecer na tela de escolher alunos nas próximas vezes.
--
-- Rode no SQL Editor do Supabase da escola. Pode rodar mais de uma vez.
alter table public.anotacoes_aluno_laboratorio
  drop constraint if exists anotacoes_aluno_laboratorio_tipo_check;

alter table public.anotacoes_aluno_laboratorio
  add constraint anotacoes_aluno_laboratorio_tipo_check
  check (tipo in ('observacao', 'elogio', 'comportamento', 'impedimento', 'saiu_antes'));
