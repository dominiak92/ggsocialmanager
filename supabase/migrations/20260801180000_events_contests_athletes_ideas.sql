-- Reszta domeny panelu: eventy, konkursy, zawodnicy i pomysły.
--
-- DOSTĘP: jak w migracji `20260801140000` — pełen CRUD dla roli `anon`.
-- Świadoma decyzja właściciela, opisana w AGENTS.md → „Dostęp do danych".
-- UWAGA: `contests` trzyma DANE OSOBOWE zwycięzcy (imię, kontakt, adres
-- wysyłki). Przy tej polityce są one publicznie czytelne i edytowalne.

-- ---------------------------------------------------------------------------
-- events — zawody, gale MMA, campy i inne wydarzenia sportowe.
--
-- Sens tej tabeli to pilnowanie NAGŁOŚNIENIA: sam wpis nic nie robi, dopiero
-- zestawienie go z publikacjami (`publications.event_id`) mówi, czy event
-- gdziekolwiek poszedł. Dlatego nie ma tu kolumny „nagłośniony" — byłaby
-- kolejnym polem do ręcznego odhaczania i rozjeżdżałaby się z rzeczywistością.
-- ---------------------------------------------------------------------------
create table if not exists ggsm.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null default 'zawody' check (kind in ('zawody', 'gala', 'camp', 'seminarium', 'inne')),
  starts_on date not null,
  -- `null` = wydarzenie jednodniowe.
  ends_on date,
  place text not null default '',
  /** Czy marka sponsoruje ten event — sponsorowane pilnujemy ostrzej. */
  is_sponsored boolean not null default true,
  url text not null default '',
  note text not null default '',
  /** Ile dni przed startem zacząć przypominać o braku nagłośnienia. */
  promo_lead_days integer not null default 14 check (promo_lead_days >= 0 and promo_lead_days <= 365),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_dates_check check (ends_on is null or ends_on >= starts_on)
);

create index if not exists events_starts_idx on ggsm.events (starts_on desc);

drop trigger if exists events_touch on ggsm.events;
create trigger events_touch before update on ggsm.events
  for each row execute function ggsm.touch_updated_at();

-- ---------------------------------------------------------------------------
-- contests — konkursy na fanpage'u.
--
-- Konkurs ma termin ważności i MUSI zostać zamknięty — to najczęstsze miejsce,
-- w którym coś umyka. Dlatego status jest jawnym etapem, a nie polem
-- wyliczanym: „minął termin" to fakt z kalendarza, ale „rozstrzygnięty"
-- i „nagroda wysłana" to decyzje człowieka.
-- ---------------------------------------------------------------------------
create table if not exists ggsm.contests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  /** Gdzie konkurs żyje; `null`, gdy obejmuje kilka kanałów. */
  channel_id uuid references ggsm.channels (id) on delete set null,
  starts_on date not null,
  ends_on date not null,
  prize text not null default '',
  status text not null default 'running' check (status in ('running', 'picking', 'picked', 'sent')),
  winner_name text not null default '',
  winner_contact text not null default '',
  /** DANE OSOBOWE — patrz ostrzeżenie na górze pliku. */
  winner_address text not null default '',
  tracking_code text not null default '',
  url text not null default '',
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contests_dates_check check (ends_on >= starts_on)
);

create index if not exists contests_ends_idx on ggsm.contests (ends_on desc);

drop trigger if exists contests_touch on ggsm.contests;
create trigger contests_touch before update on ggsm.contests
  for each row execute function ggsm.touch_updated_at();

-- ---------------------------------------------------------------------------
-- athletes + athlete_checks — zawodnicy, których profile trzeba regularnie
-- przeglądać i komentować.
--
-- Przegląd to LOG (osobna tabela), nie kolumna „ostatnio sprawdzony".
-- Kolumna gubiłaby historię i nie dałoby się powiedzieć, czy ktoś jest
-- zaniedbywany od miesięcy, czy odwiedzony wczoraj po długiej przerwie.
-- ---------------------------------------------------------------------------
create table if not exists ggsm.athletes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  discipline text not null default '',
  instagram_url text not null default '',
  other_url text not null default '',
  /** Co ile dni profil ma być przejrzany. 0 = nie przypominaj. */
  check_every_days integer not null default 7 check (check_every_days >= 0 and check_every_days <= 365),
  is_active boolean not null default true,
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists athletes_touch on ggsm.athletes;
create trigger athletes_touch before update on ggsm.athletes
  for each row execute function ggsm.touch_updated_at();

create table if not exists ggsm.athlete_checks (
  id uuid primary key default gen_random_uuid(),
  -- Kasowanie zawodnika zabiera jego historię przeglądów — bez niego
  -- i tak nic nie znaczy.
  athlete_id uuid not null references ggsm.athletes (id) on delete cascade,
  checked_on date not null default current_date,
  note text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists athlete_checks_athlete_idx
  on ggsm.athlete_checks (athlete_id, checked_on desc);

-- ---------------------------------------------------------------------------
-- ideas — pomysły i rzeczy „do przegadania".
-- ---------------------------------------------------------------------------
create table if not exists ggsm.ideas (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  detail text not null default '',
  kind text not null default 'idea' check (kind in ('idea', 'discuss')),
  status text not null default 'new' check (status in ('new', 'doing', 'done', 'dropped')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ideas_status_idx on ggsm.ideas (status, priority desc, created_at desc);

drop trigger if exists ideas_touch on ggsm.ideas;
create trigger ideas_touch before update on ggsm.ideas
  for each row execute function ggsm.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Powiązanie publikacji z eventem i konkursem.
--
-- `on delete set null`, nie `cascade`: skasowanie eventu nie może zabierać
-- historii tego, co realnie poszło na kanały.
-- ---------------------------------------------------------------------------
alter table ggsm.publications
  add column if not exists event_id uuid references ggsm.events (id) on delete set null;

alter table ggsm.publications
  add column if not exists contest_id uuid references ggsm.contests (id) on delete set null;

create index if not exists publications_event_idx on ggsm.publications (event_id)
  where event_id is not null;
create index if not exists publications_contest_idx on ggsm.publications (contest_id)
  where contest_id is not null;

-- ---------------------------------------------------------------------------
-- RLS + granty — wzorzec jak w migracji słowników.
-- ---------------------------------------------------------------------------
alter table ggsm.events enable row level security;
alter table ggsm.contests enable row level security;
alter table ggsm.athletes enable row level security;
alter table ggsm.athlete_checks enable row level security;
alter table ggsm.ideas enable row level security;

drop policy if exists "events: open access" on ggsm.events;
create policy "events: open access" on ggsm.events for all to anon, authenticated using (true) with check (true);

drop policy if exists "contests: open access" on ggsm.contests;
create policy "contests: open access" on ggsm.contests for all to anon, authenticated using (true) with check (true);

drop policy if exists "athletes: open access" on ggsm.athletes;
create policy "athletes: open access" on ggsm.athletes for all to anon, authenticated using (true) with check (true);

drop policy if exists "athlete_checks: open access" on ggsm.athlete_checks;
create policy "athlete_checks: open access" on ggsm.athlete_checks for all to anon, authenticated using (true) with check (true);

drop policy if exists "ideas: open access" on ggsm.ideas;
create policy "ideas: open access" on ggsm.ideas for all to anon, authenticated using (true) with check (true);

grant select, insert, update, delete on ggsm.events to anon, authenticated;
grant select, insert, update, delete on ggsm.contests to anon, authenticated;
grant select, insert, update, delete on ggsm.athletes to anon, authenticated;
grant select, insert, update, delete on ggsm.athlete_checks to anon, authenticated;
grant select, insert, update, delete on ggsm.ideas to anon, authenticated;
