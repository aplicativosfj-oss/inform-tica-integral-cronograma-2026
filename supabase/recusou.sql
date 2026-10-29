-- ============================================================
-- RECUSA (acrescentado em 29/10/2026)
-- Permite registrar que a criança se recusou a ir ao laboratório:
-- ausencia = 'recusou'. Como falta e impedimento, não conta como ida.
-- Pode rodar mais de uma vez sem problema.
-- ============================================================
alter table public.laboratorio_sessoes
  drop constraint if exists laboratorio_ausencia_valida;
alter table public.laboratorio_sessoes
  add constraint laboratorio_ausencia_valida
  check (ausencia is null or ausencia in ('faltou', 'nao_autorizado', 'recusou'));
