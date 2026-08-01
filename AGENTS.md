# ggsocialmanager

GG Social Manager — React SPA hostowana na Netlify, dane w Supabase.

Ten plik jest **źródłem prawdy dla agentów AI** (Claude Code, Cursor, Copilot, Codex).
`CLAUDE.md` tylko na niego wskazuje — nie duplikuj treści.

## Do czego to służy

Panel pracy social managera marki Ground Game. **Nie łączy się z API social
mediów** — właściciel uzupełnia wszystko ręcznie. Celem jest jedno miejsce,
w którym widać: co i gdzie poszło, co jeszcze nie poszło, i co zaraz umknie.

## Stan projektu — przeczytaj najpierw

Zrobione: **cały plan (kroki 1–8)**. Stan:

| #   | Krok                                                        | Status |
| --- | ----------------------------------------------------------- | ------ |
| 1   | Kanały, rodzaje postów, publikacje                          | gotowe |
| 2   | Kalendarz: tydzień (siatka pokrycia) + miesiąc + panel dnia | gotowe |
| 3   | Eventy (zawody, gale MMA, campy) + wskaźnik nagłośnienia    | gotowe |
| 4   | Konkursy: pipeline do zamknięcia, zwycięzca, adres wysyłki  | gotowe |
| 5   | Zawodnicy sponsorowani + log przeglądów profili             | gotowe |
| 6   | Pomysły i „do przegadania"                                  | gotowe |
| 7   | Pulpit z **wyliczanymi** przypomnieniami                    | gotowe |
| 8   | Filtry, wyszukiwanie, limity list                           | gotowe |

**Przypomnienia mają być wyliczane z danych, nie wpisywane ręcznie.** Lista,
o której trzeba pamiętać, żeby ją uzupełnić, nie chroni przed zapomnieniem.
Sygnały to np.: event za X dni bez ani jednej publikacji, konkurs kończy się
jutro, konkurs po terminie a niezamknięty, nagroda nierozesłana, zawodnik
niesprawdzony od X dni, kanał milczy od X dni.

Trzy decyzje, które kształtują cały kod (szczegóły niżej):

1. **Aplikacja będzie migrowana na inną bazę i scalona z większą aplikacją.**
   Dlatego dostęp do danych jest od pierwszego commita zamknięty za interfejsami.
2. **Aplikacja nie ma własnego logowania.** Tożsamość dostarczy aplikacja
   nadrzędna (Google). Dziś jest atrapa w jednym pliku.
3. **Baza jest otwarta dla roli `anon`** — świadoma decyzja właściciela.

## Dostęp do danych — świadoma decyzja właściciela

> Wszystkie tabele domenowe mają politykę `for all to anon ... using (true)`.
> Klucz `anon` jest publiczny (siedzi w bundlu JS), więc **każdy, kto zna adres
> strony, może te dane czytać I ZMIENIAĆ.** To nie jest przeoczenie — właściciel
> został poinformowany o ryzyku (ujawnienie danych ORAZ możliwość ich skasowania)
> i wybrał tę opcję, żeby nie budować logowania, które i tak zostanie zastąpione
> przez auth z aplikacji nadrzędnej.

Konsekwencje dla agenta:

- **Nie „naprawiaj" tego samowolnie.** Zmiana polityk na `authenticated` bez
  ekranu logowania odetnie właścicielowi dostęp do aplikacji.
- **Zgłoś ryzyko ponownie, zanim dołożysz kolejne dane wrażliwe** (adresy
  zwycięzców konkursów już takie są).
- Przejście na logowanie, gdy przyjdzie taka decyzja, to: podmiana `to anon` na
  `to authenticated` w politykach + podpięcie `resolveIdentity`. **Bez zmian w UI**
  — dlatego warstwa danych i tożsamość są odseparowane.

## Stack

| Warstwa    | Wybór                    | Uwagi                                                      |
| ---------- | ------------------------ | ---------------------------------------------------------- |
| Build      | Vite 8                   | `vite.config.ts`                                           |
| UI         | React 19 + TypeScript 6  | tryb `strict`                                              |
| Routing    | React Router 8           | tryb deklaratywny (`<Routes>`), strony w `src/pages/`      |
| Style      | Tailwind CSS v4          | konfiguracja w CSS (`@theme`), NIE ma `tailwind.config.js` |
| Komponenty | shadcn/ui (baza Radix)   | kod w `src/components/ui/` — jest nasz, edytuj go          |
| Lint       | oxlint                   | `.oxlintrc.json`                                           |
| Format     | Prettier                 | `.prettierrc.json`                                         |
| Testy      | Vitest + Testing Library | pliki `*.test.ts(x)` obok kodu                             |
| Baza       | Supabase (Postgres)      | projekt `mjuvlwihjezbwbmvxnle`, schemat `ggsm`             |
| Hosting    | Netlify                  | `netlify.toml`, deploy z gałęzi `main`                     |

Node: wersja z `.nvmrc` (24). Jeśli coś dziwnie pada — sprawdź `node -v` PRZED
debugowaniem czegokolwiek innego.

## Komendy

```bash
npm run dev         # serwer deweloperski
npm run build       # typecheck + build produkcyjny
npm run typecheck   # sam tsc, bez emitu
npm run lint        # oxlint
npm run format      # prettier --write
npm test            # vitest (jednorazowo)
npm run verify      # typecheck + lint + test + build — odpal przed każdym commitem
```

## Zasady dla agenta

1. **Przed commitem zawsze `npm run verify`.** Nie raportuj zadania jako zrobionego,
   jeśli ta komenda nie przechodzi. Wklej output, jeśli coś pada.
2. **Nowe komponenty shadcn dodawaj CLI, nie ręcznie:** `npx shadcn@latest add <nazwa>`.
   Ręczne przepisywanie z dokumentacji rozjeżdża wersje i zależności.
   **PUŁAPKA:** styl `radix-nova` jest generowany pod Radix 1.7 (na razie tylko
   wersje RC), który wystawia atrybuty `data-open` / `data-checked` / `data-active`.
   Zainstalowany, najnowszy STABILNY Radix 1.6 wystawia `data-state="open"` itd.
   Mapowanie obu form siedzi w `src/index.css` (blok `@custom-variant`) — bez
   niego przełączniki są bez tła, aktywna zakładka bez podświetlenia, a dialogi
   bez animacji. Objaw jest **czysto wizualny**, więc typecheck i testy
   przechodzą jak gdyby nigdy nic. Jeśli nowy komponent używa kolejnego wariantu
   `data-*`, dopisz go tam. Uwaga na składnię: forma z przecinkiem
   (`@custom-variant x (&[a], &[b])`) gubi prefiks klasy i generuje selektor
   globalny — musi być forma blokowa z `@slot`.
3. **Nie edytuj `src/components/ui/*` „kosmetycznie".** To wygenerowany kod shadcn.
   Zmieniaj go tylko celowo (wtedy opisz zmianę) — inaczej trudno go zaktualizować.
4. **Importy przez alias `@/`**, nie przez `../../..`. Alias jest w `tsconfig.json`,
   `tsconfig.app.json` i `vite.config.ts` — musi się zgadzać we wszystkich trzech.
5. **Tailwind v4 nie ma pliku konfiguracyjnego.** Tokeny (kolory, promienie) żyją
   w `src/index.css` w blokach `@theme` / `:root` / `.dark`. Nie twórz
   `tailwind.config.js`. Animacje: `tw-animate-css`, ZAWSZE z wariantem
   `motion-safe:`. **Wejście widoku jest JEDNO i należy do layoutu**
   (`<main key={pathname}>` w `AppShell`) — nie dokładaj animacji wejścia na
   kontenerach stron ani listach, bo przy dociąganiu danych odpalają się ponownie
   i dają kaskadę migotania. Cele dotykowe podnosi globalny blok
   `@media (pointer: coarse)` w `index.css` — nie powtarzaj tego per komponent.
   Wysokości okna licz w `dvh`, nie `vh`.
6. **Bez `any`.** Jeśli typ jest trudny — użyj `unknown` i zawęź.
7. **Nie dodawaj bibliotek bez potrzeby.** Zanim dołożysz zależność, sprawdź,
   czy shadcn / Radix / natywne API tego nie robi.
8. **Zmienne środowiskowe:** tylko prefiks `VITE_`, deklaruj typy w `src/vite-env.d.ts`.
   Nigdy nie commituj `.env.local`. Sekrety nie mogą trafiać do bundla frontendowego.
9. **Aktualizuj ten plik.** Każda zmiana, która zmienia obraz projektu opisany
   w AGENTS.md — nowa reguła domenowa, nowa migracja zmieniająca zachowanie, nowy
   przepływ w UI, zmiana grantów/RLS, nowa trasa — musi zostać tu odnotowana
   **w tym samym commicie**. AGENTS.md to źródło prawdy, nie changelog: opisuj
   **stan aktualny**, zwięźle; nie prowadź historii „co było wcześniej".

## Warstwa danych — granica architektoniczna

To najważniejsza decyzja w projekcie. **Nie omijaj jej.**

Ta aplikacja ma zaplanowaną **migrację na inną bazę** i scalenie z większym
systemem. Żeby to nie było przepisywaniem wszystkiego, dostęp do danych jest
zamknięty za interfejsami repozytoriów (`src/data/interfaces.ts`). UI i hooki
znają wyłącznie model domenowy (`src/domain/*`) i te interfejsy — nigdy typów
Supabase.

```text
UI / hooki  ->  domain/* (nasze typy)  ->  data/interfaces (repo)  ->  [Supabase | inna baza]
```

- **Dziś** interfejsy spełnia implementacja Supabase (`src/data/supabase/`). To
  JEDYNY katalog importujący klienta Supabase. Jeśli piszesz
  `from '@/lib/supabase'` gdziekolwiek indziej — robisz to źle.
- Mapowanie Row → domena jest w `data/supabase/mappers.ts`. **Nie przeciekaj
  kształtu bazy wyżej** — nigdy nie przekazuj surowego wiersza do komponentów.
- **Wybór implementacji jest w jednym miejscu:** `src/data/provider.ts`. Podmiana
  backendu = nowa implementacja interfejsów + zmiana jednej linii, bez ruszania UI.
- Nowa domena = nowy typ w `domain/models.ts`, nowy kontrakt repo
  w `data/interfaces.ts`, implementacja w `data/supabase/`, hook w `hooks/`.

## Tożsamość i auth

**Ta aplikacja świadomie NIE MA własnego logowania.** Docelowo jest częścią
większej aplikacji, która loguje użytkowników przez **Google** i przekaże tu
gotową tożsamość.

- Cały dostęp do „kto jest zalogowany" idzie przez `useIdentity()`
  (`src/lib/auth/identity.tsx`). Zwraca `Identity | null`.
- Dziś `resolveIdentity()` zwraca **atrapę** (`Tryb samodzielny`). To NIE jest
  konto z bazy — RLS jej nie zna i nie honoruje.
- **Podpięcie prawdziwego auth = podmiana `resolveIdentity` w tym jednym pliku.**
  Reszta kodu się nie zmienia.
- **NIE dodawaj** ekranu logowania, `supabase.auth.signIn*` ani własnej sesji.
  Klient Supabase ma celowo `persistSession: false` — drugi, konkurencyjny stan
  logowania tylko myli.
- Konsekwencja dla bazy: dopóki nie ma sesji, żądania lecą rolą `anon`. Polityki
  RLS oparte o `auth.uid()` nie zwrócą nic — i tak ma być. Projektuj je już teraz
  pod `auth.uid()`, żeby po podpięciu auth zadziałały bez migracji.

## Supabase — przeczytaj, zanim dotkniesz bazy

Projekt: **`mjuvlwihjezbwbmvxnle`** (`ggsocialmanager`), region `eu-west-1`,
organizacja `dominiak-groundgame`.

> **To samo konto Supabase co `groundgamelab`, ale ODDZIELNY projekt.** Własna
> baza, własne klucze, własny schemat. Nie mieszaj tabel ani kluczy między nimi.
> Do operacji CLI użyj Personal Access Tokenu (`SUPABASE_ACCESS_TOKEN`, `sbp_...`)
> — globalne `supabase login` może wskazywać na inne konto. Nie przelogowuj go
> „przy okazji", bo zepsujesz CLI w pozostałych projektach.

Twarde granice:

- **Nasze tabele żyją WYŁĄCZNIE w schemacie `ggsm`.** Nie twórz nic w `public` —
  jest domyślnie eksponowany przez PostgREST i łatwo o wyciek. Klient Supabase
  jest przypięty do `ggsm` przez `db: { schema: 'ggsm' }`.
- **Klucz `anon` jest publiczny** — siedzi w bundlu JS. Jedyną ochroną danych
  jest RLS, a ta jest dziś celowo otwarta (patrz „Dostęp do danych").
- **Każda tabela w `ggsm` musi mieć RLS i jawne polityki.** Domyślne uprawnienia
  w schemacie są odebrane (`alter default privileges ... revoke all`), więc każda
  nowa tabela wymaga świadomego `grant`. Kopiuj wzorzec z migracji
  `20260801140000_channels_publications.sql`.
- **Czasu modyfikacji nie ustawia klient** — pilnuje go trigger
  `ggsm.touch_updated_at()`. Podpinaj go do każdej nowej tabeli.
- **Zmiany schematu idą przez migracje** w `supabase/migrations/`, nie przez
  klikanie w panelu.
- `src/lib/database.types.ts` jest **generowany** — nie edytuj go ręcznie.
- **Nowy schemat musi być wystawiony w PostgREST**, inaczej klient dostanie
  `permission denied` mimo poprawnej migracji. `ggsm` jest już dodany
  (Dashboard → Settings → API → Exposed schemas: `public,graphql_public,ggsm`).

Stosowanie migracji i typy:

```bash
export SUPABASE_ACCESS_TOKEN='sbp_...'      # PAT z konta dominiak-groundgame
export SUPABASE_DB_PASSWORD='...'           # hasło do bazy tego projektu
npx supabase db push                        # aplikuje migracje z supabase/migrations
npm run db:types                            # przegeneruj typy PO KAŻDEJ migracji
```

`npm run db:types` używa składni `$SUPABASE_PROJECT_ID` — na Windows odpal go
z Git Basha, nie z PowerShella.

## Model domenowy

- **Kanał** (`channels`) = platforma + rynek, np. Fanpage FB / CZ. Startowo 16
  (grupa FB, 6 fanpage'y, 5 Instagramów, TikTok, YouTube, Newsletter,
  Akademia/Sklep/Blog jako JEDEN kanał), ale listę da się edytować z Ustawień.
  `code` (`fb-pl`, `ig-cz`, ...) to stabilny klucz seedów — nie zmieniaj go;
  dla nowych kanałów wylicza go `slugify(name)`, a o unikalność dba `unique`
  w bazie (kod `23505` mapujemy na czytelny komunikat).
  **Kanał z publikacjami jest nieusuwalny** — chroni go klucz obcy
  (`on delete restrict`), a repo zamienia błąd `23503` na `ChannelInUseError`.
  Domyślną operacją jest **wyłączenie** (`is_active`), nie kasowanie.
- **Próg ciszy** (`channels.reminder_after_days`) — po ilu dniach bez
  publikacji kanał upomina się na pulpicie. Per kanał, bo rytmy są różne:
  Instagram milczący 3 dni to problem, newsletter co 30 dni to norma. `0`
  wyłącza przypominanie dla kanału.
- **Rodzaj postu** (`post_types`) — słownik, nie enum, bo lista będzie rosła.
  Startowo: produkt, news, lifestyle, tips & tricks, współpraca, event, artykuł,
  meme, konkurs. `color` to nazwa palety; na klasę CSS zamienia ją
  `postTypeColorClass` — **nie składaj klas Tailwinda ze stringów**
  (`bg-${color}-500` nie zostanie wygenerowane).
- **Publikacja** (`publications`) — JEDEN byt na „zaplanowane" i „wrzucone".
  Odhaczenie w kalendarzu to zmiana `status` z `planned` na `published`, nie
  osobna tabela. Dzięki temu ta sama siatka służy do planowania w przód i do
  raportowania wstecz. Domyślny status zależy od daty (dziś/wstecz →
  `published`, przyszłość → `planned`).
- **„Event" i „konkurs" są jednocześnie rodzajem postu i osobnym bytem** — to
  celowe. Rodzaj opisuje treść publikacji, a osobne tabele trzymają samo
  wydarzenie. Publikacja wskazuje konkretny event/konkurs przez `event_id` /
  `contest_id` (`on delete set null`, nie `cascade` — skasowanie eventu nie może
  zabierać historii tego, co realnie poszło na kanały).
- **Event** (`events`) — zawody, gala MMA, camp. **Nie ma pola „nagłośniony"**;
  pokrycie liczy `eventPromo` z powiązanych publikacji. Osobna kolumna byłaby
  kolejnym polem do ręcznego odhaczania i rozjechałaby się z rzeczywistością.
  `promo_lead_days` mówi, ile dni przed startem pulpit ma się upominać.
- **Konkurs** (`contests`) — etapy `running → picking → picked → sent`.
  `picking` („minął termin, trzeba rozstrzygnąć") jest **osobnym, jawnym
  etapem**, bo to tam najczęściej coś umyka: sam upływ daty niczego nie zamyka.
  Statusu nie wyliczamy z dat — „rozstrzygnięty" i „wysłane" to decyzje
  człowieka. **`winner_address` to dane osobowe** (patrz „Dostęp do danych").
- **Zawodnik** (`athletes`) + **log przeglądów** (`athlete_checks`). Przegląd
  jest LOGIEM, nie kolumną „ostatnio sprawdzony": kolumna gubiłaby historię
  i nie dałoby się odróżnić kogoś zaniedbywanego od miesięcy od odwiedzonego
  wczoraj po długiej przerwie. `check_every_days` to rytm per zawodnik.
  Historia jest widoczna w dialogu edycji **z możliwością cofnięcia** — bez tego
  omyłkowe kliknięcie „Przejrzany" było nieodwracalne.
- **Sporty zawodnika to TAGI** (`athletes.disciplines text[]`), nie jedna nazwa.
  Realne dane są wielowartościowe („K1", „Muay Thai") i mieszają sport
  z organizacją („MMA", „KSW", „UFC"). Przy jednym polu tekstowym filtr „MMA"
  rozbiłby się na trzy osobne grupy zamiast złapać wszystkich. Lista filtruje
  się po tych tagach, a `TagInput` podpowiada istniejące wartości — bez
  podpowiedzi dane rozjeżdżają się na „BJJ" / „bjj" i filtr przestaje działać.
- **Gwiazdka** (`athletes.is_starred`) — ważniejszy zawodnik. **Wygrywa
  z przekroczeniem progu** przy sortowaniu (`athletesDue`), ale go NIE omija:
  gwiazdkowany, który jest na bieżąco, nadal nie krzyczy.
- **Pomysły** (`ideas`) — `kind` rozdziela pomysł od tematu „do przegadania",
  `status` i `priority` porządkują listę.

**Daty to daty, nie momenty.** `publish_on` jest typu `date`, a klucz dnia
w kodzie składa `toDateKey()` z lokalnych komponentów. **Nigdy nie używaj
`toISOString()`** do klucza dnia — konwersja do UTC przesuwa wieczorne wpisy na
poprzedni dzień. Cała arytmetyka kalendarza siedzi w `lib/dates.ts` i ma testy.

**Przypomnienia liczy `domain/reminders.ts`** — czysta funkcja z wstrzykiwanym
„dziś", więc da się ją przetestować. Nowy sygnał dopisuj tam, nie w komponencie.
Do liczenia ciszy bierzemy wyłącznie wpisy `published`: zaplanowany post
niczego jeszcze nie odtrąbił.

## Siatka kalendarza — dlaczego tak

Siatka tygodnia ma **stałą wysokość komórek** (`h-[3.25rem]`) i pokazuje
maksymalnie 2 wpisy, resztę chowając pod „+N więcej" (otwiera panel dnia).
Tabela jest `table-fixed` z jawnym `<colgroup>`. To nie jest kosmetyka:
bez tych trzech rzeczy jeden dzień z pięcioma wpisami rozpychał rząd, a długi
tytuł zmieniał szerokość kolumny — siatka „skakała" przy każdym dodaniu.
**Nie zdejmuj limitu ani `table-fixed`** w imię pokazania kompletu; komplet
jest w panelu dnia. Ten widok ma pokazywać DZIURY, nie detale.

Dialogi z formularzem mają `max-h-[85dvh]` i przewijany środek (nagłówek
i stopka stoją). Bez tego okno rosło i kurczyło się przy zmianie treści,
a przyciski uciekały spod kursora.

## Struktura

```text
src/
  components/ui/        # wygenerowane komponenty shadcn (nie ruszaj bez powodu)
  components/           # nasze komponenty aplikacyjne (motyw, error boundary)
  components/layout/    # rama aplikacji (AppShell: nagłówek z nawigacją)
  components/calendar/  # siatka tygodnia, miesiąc, panel dnia, dialog wpisu
  pages/                # widoki podpięte pod router
  domain/enums.ts       # wyliczenia + etykiety PL (zgodne z `check` w bazie)
  domain/models.ts      # model domenowy — zero I/O, zero Supabase
  domain/calendar.ts    # czysta logika grupowania (siatka, dzień, sekcje)
  data/interfaces.ts    # kontrakty repozytoriów + DataProvider
  data/supabase/        # implementacja repo na Supabase + mappery Row->domena
  data/provider.ts      # WYBÓR backendu — jedno miejsce
  hooks/                # useChannels, usePublications, ... — tylko na interfejsach
  lib/auth/identity.tsx # PUNKT WYMIANY TOŻSAMOŚCI (docelowo auth z aplikacji nadrzędnej)
  lib/dates.ts          # arytmetyka kalendarza (lokalne daty, nie UTC)
  lib/supabase.ts       # klient przypięty do schematu `ggsm`
  lib/database.types.ts # GENEROWANY z bazy — nie edytuj ręcznie
  lib/utils.ts          # helper cn() od shadcn
  test/setup.ts         # bootstrap Vitest
  App.tsx               # routing
  main.tsx              # providery (theme, tooltip, identity, router)
supabase/migrations/    # zmiany schematu `ggsm` (nigdy `public`)
```

## Trasy

| Ścieżka       | Widok                                                             |
| ------------- | ----------------------------------------------------------------- |
| `/`           | Pulpit — wszystkie wyliczane sygnały w czterech kartach           |
| `/kalendarz`  | Siatka tygodnia / przegląd miesiąca / panel dnia                  |
| `/eventy`     | Wydarzenia + wskaźnik „na ilu kanałach nagłośnione"               |
| `/konkursy`   | Konkursy z etapami aż do wysłanej nagrody                         |
| `/zawodnicy`  | Sponsorowani zawodnicy, zaniedbani na górze, odhaczanie przeglądu |
| `/pomysly`    | Pomysły i tematy do przegadania                                   |
| `/ustawienia` | Dodawanie, edycja i wyłączanie kanałów                            |

## Sygnały na pulpicie

Wszystkie liczy `domain/reminders.ts` (czyste funkcje, „dziś" wstrzykiwane
argumentem — inaczej testy psułyby się o północy). Nowy sygnał dopisuj TAM,
nie w komponencie.

| Sygnał                  | Kiedy krzyczy                                                                                       |
| ----------------------- | --------------------------------------------------------------------------------------------------- |
| Event bez zapowiedzi    | start w oknie `promo_lead_days`, zero powiązanych publikacji                                        |
| Konkurs do ruszenia     | kończy się ≤2 dni, minął termin przy statusie `running`, czeka na zwycięzcę albo na wysyłkę nagrody |
| Cichy kanał             | dni od ostatniej publikacji > `reminder_after_days`                                                 |
| Zawodnik do odwiedzenia | dni od ostatniego przeglądu > `check_every_days`                                                    |

Trzy zasady wspólne dla wszystkich: liczymy **wyłącznie z wpisów `published`**
(plan niczego jeszcze nie odtrąbił), sortujemy po **przekroczeniu progu**,
nie po surowej liczbie dni (kanał 27 dni po swoim terminie jest pilniejszy niż
taki 10 dni po, choćby ten drugi milczał dłużej), a konkurs dostaje **jeden,
najpilniejszy powód**, nie wszystkie naraz — inaczej lista puchnie duplikatami.

## Wspólne komponenty formularzy

Nowe formularze buduj na `components/shared/entity-dialog.tsx`
(`EntityDialog`) i `components/shared/field.tsx` (`TextField`, `NumberField`,
`NoteField`, `Field`), a nie na gołym `DialogContent`. `EntityDialog` trzyma
`max-h-[85dvh]` i przewija wyłącznie środek — bez tego okno rośnie i kurczy się
przy zmianie treści, a przyciski uciekają spod kursora.

Listy CRUD-owe idą przez `hooks/use-collection.ts` (`useCollection`) spięty
w `hooks/use-domain.ts`. Cztery listy robiły dokładnie to samo, więc jest jeden
hook sparametryzowany repozytorium — nie dopisuj piątej kopii.

**Ikony marek:** `lucide-react` 1.x NIE MA ikon Instagrama, Facebooka ani
innych logotypów — usunięto je z pakietu. Nasze siedzą jako inline SVG
w `components/shared/social-link.tsx`. Nie dokładaj biblioteki ikon dla dwóch
symboli; dopisz kolejny glif tam. `SocialLink` robi `stopPropagation`, bo
ikony stoją w wierszu, którego kliknięcie otwiera edycję.

**Operacje niszczące wymagają potwierdzenia.** Kasowanie zawodnika (zabiera log
przeglądów) i kanału idzie przez `AlertDialog`. Przy zawodniku podpowiadamy
wyłączenie przełącznika „Aktywny" jako łagodniejszą alternatywę.

**Filtry idą przez `components/shared/filter-chips.tsx`** (`FilterChips`) —
jeden komponent na wszystkie listy, żeby paski filtrów zachowywały się tak samo.
Nie zawijają się, tylko przewijają w poziomie.

## Listy muszą znosić skalę

Realne dane szybko przerastają naiwne widoki. Reguły wyciągnięte z boju:

- **Pulpit pokazuje maksymalnie 5 wierszy na kartę** (`VISIBLE_ROWS`
  w `signal-card.tsx`), resztę chowa pod „…i jeszcze N". Przy 38 zawodnikach
  bez ani jednego przeglądu karta renderowała 38 wierszy i pulpit przestawał
  być sygnałem, a stawał się ścianą tekstu. **Nie zdejmuj tego limitu** —
  pulpit ma mówić „ile i co najpilniejsze", pełna lista jest kliknięcie dalej.
- **Listy z osią czasu domyślnie pokazują to, co przed nami.** Eventy startują
  na „Nadchodzące", konkursy na „W toku". Bez tego minione wydarzenia
  gromadzą się na SZCZYCIE listy (sortowanie rosnąco po dacie) i trzeba je
  przewijać, żeby dojść do rzeczy wymagających reakcji.
- **Powyżej ~20 rekordów lista potrzebuje wyszukiwarki**, nie tylko filtrów.
  Zawodnicy szukają się po nazwisku ORAZ po sporcie — wpisanie „BJJ" daje
  ten sam efekt co kliknięcie chipa, bo użytkownik nie ma pamiętać, gdzie kliknąć.
- **Kalendarz zawęża się po platformie i rynku** (`filterChannels`
  w `domain/calendar.ts`). Szesnaście wierszy nie mieści się na ekranie.

## Deploy

Site: **[ggsocialmanager.netlify.app](https://ggsocialmanager.netlify.app)**
(konto `dominiak92`, repo `dominiak92/ggsocialmanager` podpięte przez GitHub App).

Push na `main` → Netlify buduje automatycznie (`npm run build`, katalog `dist`).
SPA fallback jest w `netlify.toml` — bez niego odświeżenie na podstronie da 404.

Zmienne `VITE_SUPABASE_URL` i `VITE_SUPABASE_ANON_KEY` muszą być ustawione
w panelu Netlify (Site configuration → Environment variables), inaczej build
przejdzie, ale aplikacja wywali się przy starcie (zobaczysz ekran z
`ErrorBoundary`). Po zmianie zmiennych trzeba redeploy — zmienne wchodzą do
bundla przy buildzie.

CI (`.github/workflows/ci.yml`) odpala `npm run verify` na atrapach zmiennych —
build nie może zależeć od prawdziwych sekretów.
