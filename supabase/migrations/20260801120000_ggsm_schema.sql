-- Fundament schematu aplikacji.
--
-- Wszystko, co nasze, żyje w schemacie `ggsm` — NIGDY w `public`. `public` jest
-- domyślnie eksponowany przez PostgREST i łatwo o przypadkowy wyciek.
-- Schemat musi być dopisany do „Exposed schemas" w PostgREST, inaczej klient
-- dostanie `permission denied` mimo poprawnej migracji.

create schema if not exists ggsm;

-- Role PostgREST muszą móc „wejść" do schematu. Samo `usage` nie daje dostępu
-- do tabel — te nadajemy jawnie, per tabela, niżej.
grant usage on schema ggsm to anon, authenticated;

-- Domyślnie NIC nie jest dostępne. Każda nowa tabela dostaje granty świadomie.
alter default privileges in schema ggsm revoke all on tables from anon, authenticated;

-- ---------------------------------------------------------------------------
-- app_health — sonda połączenia end-to-end (przeglądarka → PostgREST → Postgres)
--
-- Jedyny cel: pulpit ma dowód, że aplikacja naprawdę czyta z bazy, a nie
-- pokazuje zaślepki. Tabela jest read-only dla klienta; wpisy dodaje migracja.
-- ---------------------------------------------------------------------------
create table if not exists ggsm.app_health (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  checked_at timestamptz not null default now()
);

alter table ggsm.app_health enable row level security;

-- Świadomy wyjątek: to jedyna tabela czytelna bez logowania. Nie ma w niej
-- danych wrażliwych. Każda kolejna tabela musi mieć własną, węższą politykę.
drop policy if exists "app_health: public read" on ggsm.app_health;
create policy "app_health: public read" on ggsm.app_health for select to anon, authenticated using (true);

grant select on ggsm.app_health to anon, authenticated;

-- Re-runnable: jeden wiersz-znacznik.
insert into ggsm.app_health (id, label)
values ('00000000-0000-0000-0000-000000000001', 'ggsm: połączenie z bazą')
on conflict (id) do update set checked_at = now();
