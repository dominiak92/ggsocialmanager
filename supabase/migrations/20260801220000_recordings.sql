-- Nagrywki: materiały do nakręcenia, najczęściej odtworzenia cudzej rolki.
--
-- DOSTĘP: jak w pozostałych tabelach — pełen CRUD dla roli `anon`.
-- Świadoma decyzja właściciela, patrz AGENTS.md → „Dostęp do danych".

-- ---------------------------------------------------------------------------
-- recording_stages — etapy produkcji WPISYWANE PRZEZ WŁAŚCICIELA.
--
-- Celowo tabela, a nie `check` na kolumnie ani enum: właściciel powiedział
-- wprost, że etapy chce ustalać sam. Enum wymagałby migracji przy każdej
-- zmianie procesu, a wolny tekst rozjechałby się na „montaż" / „Montaż" /
-- „w montazu" i uniemożliwił grupowanie.
--
-- `sort_order` daje kolejność pipeline'u, dzięki czemu „przesuń dalej"
-- wie, co jest następne.
-- ---------------------------------------------------------------------------
create table if not exists ggsm.recording_stages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text not null default 'slate',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists recording_stages_touch on ggsm.recording_stages;
create trigger recording_stages_touch before update on ggsm.recording_stages
  for each row execute function ggsm.touch_updated_at();

-- ---------------------------------------------------------------------------
-- recordings — jedna nagrywka.
--
-- `reference_url` to link do materiału, który chcemy odtworzyć (rolka, TikTok).
-- `idea` to opis pomysłu na własną wersję. Zawodnik jest OPCJONALNY —
-- właściciel zaznaczył, że nagrywka nie musi być z kimkolwiek powiązana.
-- ---------------------------------------------------------------------------
create table if not exists ggsm.recordings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  /** Link do materiału, który odtwarzamy. */
  reference_url text not null default '',
  /** Pomysł na naszą wersję — swobodny opis. */
  idea text not null default '',
  -- Skasowanie zawodnika nie może zabierać nagrywki: pomysł zostaje aktualny
  -- także wtedy, gdy przestajemy go sponsorować.
  athlete_id uuid references ggsm.athletes (id) on delete set null,
  -- Skasowany etap zostawia nagrywkę bez etapu, a nie kasuje jej razem z nim.
  stage_id uuid references ggsm.recording_stages (id) on delete set null,
  note text not null default '',
  /** Gotowe nagrywki schodzą z listy roboczej, ale zostają w archiwum. */
  is_done boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists recordings_stage_idx on ggsm.recordings (stage_id, created_at desc);
create index if not exists recordings_athlete_idx on ggsm.recordings (athlete_id)
  where athlete_id is not null;

drop trigger if exists recordings_touch on ggsm.recordings;
create trigger recordings_touch before update on ggsm.recordings
  for each row execute function ggsm.touch_updated_at();

-- ---------------------------------------------------------------------------
-- RLS + granty
-- ---------------------------------------------------------------------------
alter table ggsm.recording_stages enable row level security;
alter table ggsm.recordings enable row level security;

drop policy if exists "recording_stages: open access" on ggsm.recording_stages;
create policy "recording_stages: open access" on ggsm.recording_stages for all to anon, authenticated using (true) with check (true);

drop policy if exists "recordings: open access" on ggsm.recordings;
create policy "recordings: open access" on ggsm.recordings for all to anon, authenticated using (true) with check (true);

grant select, insert, update, delete on ggsm.recording_stages to anon, authenticated;
grant select, insert, update, delete on ggsm.recordings to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Etapy startowe. To tylko PROPOZYCJA — właściciel może je zmienić, usunąć
-- albo dopisać własne w Ustawieniach. Wstawiamy je wyłącznie wtedy, gdy
-- tabela jest pusta, żeby ponowny przebieg migracji nie przywracał etapów
-- skasowanych świadomie.
-- ---------------------------------------------------------------------------
insert into ggsm.recording_stages (name, color, sort_order)
select * from (values
  ('Pomysł', 'slate', 10),
  ('Do nagrania', 'amber', 20),
  ('Nagrane', 'blue', 30),
  ('W montażu', 'violet', 40),
  ('Gotowe', 'lime', 50)
) as seed(name, color, sort_order)
where not exists (select 1 from ggsm.recording_stages);
