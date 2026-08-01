-- Codzienna rutyna: sprawdzenie wiadomości, komentarzy i oznaczeń.
--
-- DOSTĘP: jak w pozostałych tabelach — pełen CRUD dla roli `anon`.
-- Świadoma decyzja właściciela, patrz AGENTS.md → „Dostęp do danych".

-- ---------------------------------------------------------------------------
-- daily_task_types — CO sprawdzamy każdego dnia. Słownik właściciela.
--
-- `per_market` to sedno tego modelu. Wiadomości i komentarze trzeba przejrzeć
-- OSOBNO na każdym rynku (każdy fanpage ma własną skrzynkę), ale „oznaczenia
-- do wrzucenia na story" ogarnia się raz dla całej marki. Bez tej flagi albo
-- rozdmuchalibyśmy listę o zadania, których nie ma, albo zgubili podział,
-- który właściciel wprost wskazał.
-- ---------------------------------------------------------------------------
create table if not exists ggsm.daily_task_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  /** Wskazówka, czego dotyczy — widoczna pod nazwą. */
  hint text not null default '',
  /** `true` = jeden ptaszek na rynek; `false` = jeden dla całej marki. */
  per_market boolean not null default false,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists daily_task_types_touch on ggsm.daily_task_types;
create trigger daily_task_types_touch before update on ggsm.daily_task_types
  for each row execute function ggsm.touch_updated_at();

-- ---------------------------------------------------------------------------
-- daily_task_checks — LOG odhaczeń.
--
-- Sama OBECNOŚĆ wiersza znaczy „zrobione". Dzięki temu reset o północy dzieje
-- się sam: nowy dzień to nowa data, więc nic nie jest odhaczone — nie ma
-- żadnego zadania cyklicznego ani kolumny do czyszczenia.
--
-- Log, a nie flaga na typie, daje też historię: widać, czy rynek CZ jest
-- regularnie pomijany.
-- ---------------------------------------------------------------------------
create table if not exists ggsm.daily_task_checks (
  id uuid primary key default gen_random_uuid(),
  task_type_id uuid not null references ggsm.daily_task_types (id) on delete cascade,
  /** Rynek (`PL`, `DE`, ...) albo `null` dla zadań wspólnych dla marki. */
  market text check (market in ('PL', 'EN', 'CZ', 'RO', 'DE', 'LT')),
  done_on date not null default current_date,
  created_at timestamptz not null default now()
);

-- Podwójne kliknięcie nie może utworzyć dwóch odhaczeń tego samego zadania.
-- `coalesce` na rynku, bo w Postgresie NULL-e nie są sobie równe i unikat
-- bez tego przepuściłby duplikaty zadań wspólnych.
create unique index if not exists daily_task_checks_unique
  on ggsm.daily_task_checks (task_type_id, coalesce(market, ''), done_on);

create index if not exists daily_task_checks_day_idx on ggsm.daily_task_checks (done_on desc);

-- ---------------------------------------------------------------------------
-- RLS + granty
-- ---------------------------------------------------------------------------
alter table ggsm.daily_task_types enable row level security;
alter table ggsm.daily_task_checks enable row level security;

drop policy if exists "daily_task_types: open access" on ggsm.daily_task_types;
create policy "daily_task_types: open access" on ggsm.daily_task_types for all to anon, authenticated using (true) with check (true);

drop policy if exists "daily_task_checks: open access" on ggsm.daily_task_checks;
create policy "daily_task_checks: open access" on ggsm.daily_task_checks for all to anon, authenticated using (true) with check (true);

grant select, insert, update, delete on ggsm.daily_task_types to anon, authenticated;
grant select, insert, update, delete on ggsm.daily_task_checks to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Zadania startowe — wprost z opisu właściciela. Tylko gdy tabela jest pusta,
-- żeby ponowny przebieg nie przywracał zadań skasowanych świadomie.
-- ---------------------------------------------------------------------------
insert into ggsm.daily_task_types (name, hint, per_market, sort_order)
select * from (values
  ('Wiadomości', 'Skrzynki na Instagramie i Facebooku', true, 10),
  ('Komentarze', 'Komentarze pod postami', true, 20),
  ('Oznaczenia', 'Ktoś oznaczył markę — sprawdź i wrzuć na story', false, 30)
) as seed(name, hint, per_market, sort_order)
where not exists (select 1 from ggsm.daily_task_types);
