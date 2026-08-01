-- Naprawa celu ON CONFLICT dla odhaczeń codziennej rutyny.
--
-- Poprzedni indeks stał na WYRAŻENIU `coalesce(market, '')`, żeby NULL-owy
-- rynek (zadania wspólne dla marki) nie przepuszczał duplikatów. Problem:
-- PostgREST przy `upsert` potrafi wskazać jako cel konfliktu wyłącznie
-- KOLUMNY, nie wyrażenia — więc `ON CONFLICT (task_type_id, market, done_on)`
-- nie znajdował pasującego indeksu i podwójne kliknięcie kończyło się błędem
-- zamiast być bez skutku.
--
-- Postgres 15+ ma na to `NULLS NOT DISTINCT`: indeks stoi na zwykłych
-- kolumnach (więc `upsert` go widzi), a NULL-e traktuje jako równe sobie
-- (więc nadal nie ma duplikatów zadań wspólnych).
drop index if exists ggsm.daily_task_checks_unique;

create unique index if not exists daily_task_checks_unique
  on ggsm.daily_task_checks (task_type_id, market, done_on) nulls not distinct;
