-- Fundament domeny: kanały, rodzaje postów, publikacje.
--
-- DOSTĘP: rola `anon` ma tu pełen CRUD. To ŚWIADOMA decyzja właściciela —
-- aplikacja nie ma logowania, a klucz `anon` jest publiczny, więc każdy, kto zna
-- adres strony, może czytać I ZMIENIAĆ te dane. Patrz AGENTS.md → „Dostęp do
-- danych". Przejście na logowanie = podmiana polityk `to anon` na `to
-- authenticated`, bez zmian w UI.

-- Wspólny stempel czasu modyfikacji — używany przez wszystkie tabele domenowe.
create or replace function ggsm.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- channels — gdzie publikujemy. Kanał = platforma + rynek.
--
-- `code` jest stabilnym kluczem dla seedów i migracji; `name` może się zmieniać.
-- Kanałów się NIE KASUJE (publikacje by osierociały) — wyłącza się je
-- przez `is_active`.
-- ---------------------------------------------------------------------------
create table if not exists ggsm.channels (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  platform text not null check (
    platform in ('facebook_group', 'facebook_page', 'instagram', 'tiktok', 'youtube', 'newsletter', 'web')
  ),
  -- Rynek językowy; `null` dla kanałów bez podziału (TikTok, YouTube, ...).
  locale text check (locale in ('PL', 'EN', 'CZ', 'RO', 'DE', 'LT')),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists channels_sort_idx on ggsm.channels (sort_order, name);

drop trigger if exists channels_touch on ggsm.channels;
create trigger channels_touch before update on ggsm.channels
  for each row execute function ggsm.touch_updated_at();

-- ---------------------------------------------------------------------------
-- post_types — rodzaj treści. Tabela, nie enum: lista będzie rosła,
-- a dokładanie wartości do enuma wymaga migracji.
--
-- `color` to token motywu (nie hex), żeby kratki kalendarza działały tak samo
-- w motywie jasnym i ciemnym.
-- ---------------------------------------------------------------------------
create table if not exists ggsm.post_types (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  color text not null default 'slate',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists post_types_touch on ggsm.post_types;
create trigger post_types_touch before update on ggsm.post_types
  for each row execute function ggsm.touch_updated_at();

-- ---------------------------------------------------------------------------
-- publications — JEDEN byt na „zaplanowane" i „wrzucone".
--
-- Odhaczenie checkboxa w kalendarzu to zmiana `status` z `planned` na
-- `published`, nie osobna tabela. Dzięki temu ta sama siatka służy do
-- planowania w przód i do raportowania wstecz.
--
-- Powiązania z eventem i konkursem dokładają późniejsze migracje — dopiero
-- gdy te tabele istnieją.
-- ---------------------------------------------------------------------------
create table if not exists ggsm.publications (
  id uuid primary key default gen_random_uuid(),
  -- Dzień, którego dotyczy wpis (planowany albo faktyczny).
  publish_on date not null,
  channel_id uuid not null references ggsm.channels (id) on delete restrict,
  post_type_id uuid references ggsm.post_types (id) on delete set null,
  status text not null default 'planned' check (status in ('planned', 'published')),
  title text not null default '',
  note text not null default '',
  url text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Główne zapytanie aplikacji to „pokaż zakres dat" — indeks pod widok tygodnia
-- i miesiąca.
create index if not exists publications_range_idx on ggsm.publications (publish_on, channel_id);
create index if not exists publications_channel_idx on ggsm.publications (channel_id, publish_on desc);

drop trigger if exists publications_touch on ggsm.publications;
create trigger publications_touch before update on ggsm.publications
  for each row execute function ggsm.touch_updated_at();

-- ---------------------------------------------------------------------------
-- RLS + granty. Patrz ostrzeżenie na górze pliku.
-- ---------------------------------------------------------------------------
alter table ggsm.channels enable row level security;
alter table ggsm.post_types enable row level security;
alter table ggsm.publications enable row level security;

drop policy if exists "channels: open access" on ggsm.channels;
create policy "channels: open access" on ggsm.channels for all to anon, authenticated using (true) with check (true);

drop policy if exists "post_types: open access" on ggsm.post_types;
create policy "post_types: open access" on ggsm.post_types for all to anon, authenticated using (true) with check (true);

drop policy if exists "publications: open access" on ggsm.publications;
create policy "publications: open access" on ggsm.publications for all to anon, authenticated using (true) with check (true);

grant select, insert, update, delete on ggsm.channels to anon, authenticated;
grant select, insert, update, delete on ggsm.post_types to anon, authenticated;
grant select, insert, update, delete on ggsm.publications to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Seed słowników. Re-runnable: `code` jest kluczem, nazwy się aktualizują,
-- a `is_active` NIE jest nadpisywane — żeby ponowny przebieg nie włączał
-- kanałów wyłączonych ręcznie.
-- ---------------------------------------------------------------------------
insert into ggsm.channels (code, name, platform, locale, sort_order) values
  ('fb-banda',   'Grupa Ground Game Banda', 'facebook_group', null, 10),
  ('fb-pl',      'Fanpage PL',              'facebook_page',  'PL', 20),
  ('fb-en',      'Fanpage EN',              'facebook_page',  'EN', 21),
  ('fb-cz',      'Fanpage CZ',              'facebook_page',  'CZ', 22),
  ('fb-ro',      'Fanpage RO',              'facebook_page',  'RO', 23),
  ('fb-de',      'Fanpage DE',              'facebook_page',  'DE', 24),
  ('fb-lt',      'Fanpage LT',              'facebook_page',  'LT', 25),
  ('ig-pl',      'Instagram PL',            'instagram',      'PL', 30),
  ('ig-en',      'Instagram EN',            'instagram',      'EN', 31),
  ('ig-cz',      'Instagram CZ',            'instagram',      'CZ', 32),
  ('ig-ro',      'Instagram RO',            'instagram',      'RO', 33),
  ('ig-de',      'Instagram DE',            'instagram',      'DE', 34),
  ('tiktok',     'TikTok',                  'tiktok',         null, 40),
  ('youtube',    'YouTube',                 'youtube',        null, 50),
  ('newsletter', 'Newsletter',              'newsletter',     null, 60),
  ('www',        'Akademia / Sklep / Blog', 'web',            null, 70)
on conflict (code) do update set
  name = excluded.name,
  platform = excluded.platform,
  locale = excluded.locale,
  sort_order = excluded.sort_order;

insert into ggsm.post_types (code, name, color, sort_order) values
  ('produkt',      'Produkt',       'amber',   10),
  ('news',         'News',          'blue',    20),
  ('lifestyle',    'Lifestyle',     'violet',  30),
  ('tips',         'Tips & tricks', 'teal',    40),
  ('wspolpraca',   'Współpraca',    'pink',    50),
  ('event',        'Event',         'orange',  60),
  ('artykul',      'Artykuł',       'cyan',    70),
  ('meme',         'Meme',          'lime',    80),
  ('konkurs',      'Konkurs',       'rose',    90)
on conflict (code) do update set
  name = excluded.name,
  color = excluded.color,
  sort_order = excluded.sort_order;
