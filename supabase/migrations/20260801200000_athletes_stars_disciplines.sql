-- Zawodnicy: gwiazdka ważności, dyscypliny jako TAGI, jawny Facebook.
--
-- Dlaczego tablica zamiast jednej kolumny tekstowej: realne dane są
-- wielowartościowe („K1, Muay Thai") i zawierają organizację obok sportu
-- („MMA - KSW", „MMA - UFC"). Przy jednej kolumnie filtrowanie po sporcie
-- rozbiłoby MMA na trzy osobne grupy, a to jest jeden sport. Tagi rozwiązują
-- oba przypadki: „MMA - KSW" daje {MMA, KSW}, więc filtr „MMA" łapie wszystkich,
-- a „KSW" nadal da się użyć jako osobne zawężenie.

alter table ggsm.athletes
  add column if not exists is_starred boolean not null default false;

alter table ggsm.athletes
  add column if not exists disciplines text[] not null default '{}';

-- Backfill z dotychczasowej kolumny tekstowej. Rozdzielamy po przecinku,
-- ukośniku oraz po myślniku OTOCZONYM spacjami — ten ostatni warunek jest
-- istotny, żeby nie rozerwać nazw typu „K-1" czy „Muay-Thai".
update ggsm.athletes
set disciplines = coalesce(
  (
    select array_agg(tag order by tag)
    from (
      select distinct btrim(part) as tag
      from unnest(regexp_split_to_array(discipline, '\s*[,/]\s*|\s+-\s+')) as part
    ) parts
    where tag <> ''
  ),
  '{}'
)
where disciplines = '{}';

alter table ggsm.athletes drop column if exists discipline;

-- „Inny profil" w praktyce zawsze oznacza Facebooka — nazwijmy rzecz po imieniu,
-- żeby UI mógł pokazać właściwą ikonę zamiast generycznego linku.
alter table ggsm.athletes rename column other_url to facebook_url;
