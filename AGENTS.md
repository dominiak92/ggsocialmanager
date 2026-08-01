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

| #   | Krok                                                                    | Status |
| --- | ----------------------------------------------------------------------- | ------ |
| 1   | Kanały, rodzaje postów, publikacje                                      | gotowe |
| 2   | Kalendarz: tydzień (siatka pokrycia) + miesiąc + panel dnia             | gotowe |
| 3   | Eventy (zawody, gale MMA, campy) + wskaźnik nagłośnienia                | gotowe |
| 4   | Konkursy: pipeline do zamknięcia, zwycięzca, adres wysyłki              | gotowe |
| 5   | Zawodnicy sponsorowani + log przeglądów profili                         | gotowe |
| 6   | Pomysły i „do przegadania"                                              | gotowe |
| 7   | Pulpit z **wyliczanymi** przypomnieniami                                | gotowe |
| 8   | Filtry, wyszukiwanie, limity list                                       | gotowe |
| 9   | Nagrywki — materiały do nakręcenia, etapy definiowane przez właściciela | gotowe |

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
   i dają kaskadę migotania. **Cele dotykowe podnosi globalny blok
   `@media (pointer: coarse)` w `index.css` — nie powtarzaj tego per komponent.**
   Reguła celuje w `[data-slot='button'][data-size^='icon']`, więc każdy przycisk
   ikonowy zbudowany na `Button` dostaje wygodny cel automatycznie. Wniosek
   praktyczny: **małe przyciski ikonowe rób przez `Button size="icon-sm"`,
   a nie ręcznie sklejonym `<button className="size-7 …">`** — inaczej wypadają
   z tej reguły. Jedyny wyjątek to `SocialLink` (jest `<a>`, nie `Button`) —
   ma `data-touch="icon"`. Element, którego rozmiar wynika z układu (np. „+"
   w kratce kalendarza o stałej wysokości), świadomie zostaje mały: wymuszone
   40 px rozepchnęłoby mu rodzica. Wysokości okna licz w `dvh`, nie `vh`.
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

**Wejście chroni prosta bramka na hasło** (login `admin`, hasło ze zmiennej
`VITE_APP_PASSWORD`). Hasła NIE MA w kodzie — repozytorium jest publiczne,
więc commit z hasłem opublikowałby je na GitHubie. Gdy zmiennej brak, bramka
jest wyłączona, żeby lokalny dev nie mógł się zablokować.

> **Bramka to ZASŁONA, nie zamek.** Hasło porównuje przeglądarka, więc siedzi
> w bundlu JS. Co ważniejsze: klucz `anon` Supabase też jest publiczny,
> a polityki RLS są otwarte — **dane są nadal dostępne przez samo API,
> z pominięciem ekranu logowania.** Bramka chroni przed przypadkowym gościem,
> nie przed kimś, kto chce się dostać do danych.
>
> Realna ochrona = konto w Supabase Auth + przestawienie polityk z `anon` na
> `authenticated`. To JEDNA migracja plus podmiana `signIn` w
> `lib/auth/identity.tsx` — UI się nie zmienia, bo tożsamość jest odseparowana.
> Nie rób tego bez decyzji właściciela: odetnie dostęp, dopóki konto nie powstanie.

**Aplikacja nie ma własnego, docelowego logowania.** Docelowo jest częścią
większej aplikacji, która loguje użytkowników przez **Google** i przekaże tu
gotową tożsamość.

- Cały dostęp do „kto jest zalogowany" idzie przez `useIdentity()`
  (`src/lib/auth/identity.tsx`). Zwraca `Identity | null`.
- Dziś tożsamość pochodzi z bramki na hasło i jest **atrapą** — RLS jej nie zna
  i nie honoruje. To zwykły znacznik „ktoś przeszedł przez ekran logowania".
- **Podpięcie prawdziwego auth = podmiana `resolveIdentity` w tym jednym pliku.**
  Reszta kodu się nie zmienia.
- **NIE dodawaj drugiego mechanizmu sesji.** Klient Supabase ma celowo
  `persistSession: false`; cała tożsamość idzie przez `useIdentity()`.
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
  (`bg-${color}-500` nie zostanie wygenerowane). Słownik jest edytowalny
  w Ustawieniach (`PostTypesCard`). Kasowanie rodzaju jest bezpieczne
  (`publications.post_type_id` ma `on delete set null`, więc wpisy zostają),
  ale operacją domyślną jest WYŁĄCZENIE: rodzaj znika z formularza nowego
  wpisu, a kolory na starych wpisach się nie rozjeżdżają.
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
  człowieka. Pola zwycięzcy (imię, kontakt, **adres wysyłki**) są dostępne
  na KAŻDYM etapie — adres bywa znany wcześniej niż formalne rozstrzygnięcie.
  **`winner_address` to dane osobowe**, a przy obecnych politykach RLS są
  publicznie czytelne (patrz „Dostęp do danych"); bramka na hasło tego NIE
  zmienia.
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
- **Nagrywka** (`recordings`) — materiał do nakręcenia, zwykle odtworzenie
  cudzej rolki: `reference_url` (co odtwarzamy), `idea` (pomysł na naszą
  wersję), opcjonalny zawodnik i etap. **Etapy (`recording_stages`) definiuje
  właściciel**, nie kod: świadomie tabela, a nie enum ani `check`, bo proces
  bywa zmieniany, a enum wymagałby migracji przy każdej korekcie. Wolny tekst
  odpada — rozjechałby się na „montaż" / „Montaż" i uniemożliwił grupowanie.
  **`sort_order` etapów ma znaczenie ZACHOWANIA, nie wyglądu:** po nim działa
  przycisk przesuwający nagrywkę dalej. Koniec pipeline'u ustawia `is_done`.
  Zawodnik jest opcjonalny i `on delete set null` — nagrywka przeżywa
  zakończenie współpracy.
- **Pomysły** (`ideas`) — `kind` rozdziela pomysł od tematu „do przegadania",
  `status` i `priority` porządkują listę.

**Jedna treść może iść na kilka kanałów naraz.** Dialog wpisu ma przy
DODAWANIU wielokrotny wybór kanałów, a przy EDYCJI pojedynczy — istniejąca
publikacja należy do jednego kanału i jej „rozmnożenie" byłoby dwuznaczne.
Zapis idzie przez `publications.createMany` jednym żądaniem, nie pętlą: N
osobnych zapytań to N okazji do częściowej porażki i N przeładowań listy.

Skróty rynków w tym wyborze używają `channelsWithLocale`, a NIE
`filterChannels`. Różnica jest celowa i łatwo ją zepsuć: filtr kalendarza
zostawia kanały bez rynku (TikTok, YouTube, newsletter, WWW), bo obsługują
wszystkie rynki naraz i ich zniknięcie sugerowałoby dziurę w pokryciu — ale
skrót „zaznacz PL" przy dodawaniu wpisu ma zaznaczyć polskie kanały, a nie
dorzucić TikToka. Obie funkcje mają testy opisujące tę różnicę.

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

## Pulpit — dwie warstwy

1. **„Dziś"** (`TodayCard`) na górze: co zapisane na dzisiaj i co już poszło,
   z JEDNOKLIKNIĘCIOWYM odhaczeniem. To najczęstsza czynność w całej aplikacji
   i nie może wymagać otwierania dialogu. Wcześniej pulpit odpowiadał wyłącznie
   na „co mi umknęło", a dzień zaczyna się od „co mam dziś".
2. **Sygnały** — karty tego, co umyka.

**Nie przywracaj zbiorczego licznika „N rzeczy wymaga uwagi".** Przy 38
zawodnikach bez ani jednego przeglądu pokazywał ~55 i przestawał znaczyć
cokolwiek. Każda karta niesie własny licznik, a `alertCount` pozwala liczyć
tylko pozycje pilne, gdy lista pokazuje szerszy kontekst (karta wydarzeń
wypisuje cały horyzont, ale na czerwono liczy wyłącznie te bez zapowiedzi).

**Kolejność kart nie jest przypadkowa:** najpierw to, co wymaga reakcji dziś
(ciche kanały, zaniedbani zawodnicy), potem horyzont (wydarzenia, konkursy)
i na końcu gale ze źródła zewnętrznego. Rzeczy odległe w czasie nie mogą
przykrywać tych, które palą się teraz.

**Wydarzenia mają JEDNĄ kartę.** Wcześniej „Najbliższe wydarzenia" i „Eventy
bez zapowiedzi" stały obok siebie, a druga była podzbiorem pierwszej — te same
nazwy dwa razy do przeczytania.

## Przechodzenie między widokami

Jedyne przejście z parametrem w adresie: **pulpit → „Dziś" → `/kalendarz?dzien=YYYY-MM-DD`**,
które otwiera panel tego dnia. Parametr czyścimy po otwarciu
(`setParams({}, { replace: true })`), żeby odświeżenie strony nie otwierało go
po raz drugi.

Analogiczne skróty przy eventach, konkursach, pomysłach i galach zewnętrznych
były zbudowane i **usunięte na wyraźną prośbę właściciela** — przeskok do innego
widoku w środku pracy nad listą przeszkadzał bardziej, niż pomagał.
**Nie przywracaj ich „dla spójności".**

**PUŁAPKA, która nas ugryzła:** efekt obsługujący deep-link trzymał
w zależnościach cały obiekt z `useEntityForm`. Hook zwracał wtedy nowy literał
przy każdym renderze, więc efekt odpalał się w kółko (efekt → `openCreate`
ustawia świeży stan → render → efekt) i dialog się zawieszał. Dlatego
`useEntityForm` zwraca obiekt przez `useMemo` — jeśli dokładasz do niego pole,
zadbaj o stabilną referencję.

## Sygnały na pulpicie

Wszystkie liczy `domain/reminders.ts` (czyste funkcje, „dziś" wstrzykiwane
argumentem — inaczej testy psułyby się o północy). Nowy sygnał dopisuj TAM,
nie w komponencie.

Pulpit ma też jedną kartę **informacyjną**, nie alarmową: „Najbliższe
wydarzenia" (`upcomingEvents`, `tone="info"`). Sygnał „event bez zapowiedzi"
z definicji milczy, dopóki wydarzenie nie wejdzie w swoje `promo_lead_days`,
więc przy planach na kwartał do przodu pulpit nie mówił o nich nic. Karty
informacyjnej NIE oznaczaj czerwonym licznikiem — nic się w niej nie pali.

`SignalRow` bez `badge` i bez `trailing` **nie renderuje niczego po prawej**.
Wcześniej wychodziła z tego pusta plakietka — widoczny, pusty prostokąt przy
każdym wierszu bez akcji. Jeśli wiersz ma coś powiedzieć po prawej, podaj
`badge` (tekst) albo `trailing` (własny element), a nie licz na domyślną.

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
w `hooks/use-domain.ts`, a **rusztowanie dialogu formularza przez
`hooks/use-entity-form.ts` (`useEntityForm`)** — stan formularza, `openCreate`,
`openEdit`, `save`, `removeCurrent` i `patch`. Pięć list korzysta już z obu;
nie dopisuj szóstej kopii ręcznie.

**Słowniki kolorowane** (rodzaje postów, etapy nagrywek) mają jeden ekran:
`components/settings/stage-list-card.tsx` (`StageListCard`). To ten sam problem
— lista pozycji definiowanych przez właściciela, z kolorem używanym w widokach
— więc druga kopia rozjechałaby się z pierwszą przy pierwszej poprawce. Prop
`ordered` włącza strzałki kolejności tam, gdzie kolejność coś znaczy.

**Logo marki** jest w `public/gg-logo-inline.svg` (+ wariant `-dark`) i pochodzi
z oficjalnych plików projektu groundgamelab — **nie odrysowuj znaku ręcznie**.
Wordmark ma wpisane kolory, więc warianty przełącza klasa `dark:`, a nie
JavaScript: inaczej logo mrugałoby przy pierwszym renderze, zanim motyw
zostanie ustalony. Podmiana logo = podmiana pliku w `public/`.

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

## Źródło zewnętrzne — kalendarz gal

`src/data/external/fight-events.ts` pobiera nadchodzące gale (KSW, UFC,
Oktagon, TKO) z **TheSportsDB**. Klucz testowy `3` jest darmowy i publiczny,
a odpowiedzi mają `Access-Control-Allow-Origin: *` — dlatego wołamy je wprost
z przeglądarki, bez backendu i bez sekretów w bundlu.

**To JEDYNY wyjątek od zasady „wszystko uzupełniane ręcznie".** Twarde granice:

- **Poza `DataProvider`.** To nie jest nasza baza; nie mieszaj tego do
  repozytoriów domenowych. Migracja bazy nie ma z tym plikiem nic wspólnego.
- **Tylko do odczytu i tylko informacyjnie.** `ExternalFightEvent` to osobny typ,
  nie `SportEvent`. **Nie opieraj na tym żadnego sygnału ani wskaźnika** —
  dane bywają niepełne.
- **Nic nie wchodzi do bazy automatycznie.** „Dodaj u siebie" otwiera formularz
  eventu z wypełnioną nazwą i datą (deep-link `/eventy?dodaj=…&data=…`);
  zapis jest świadomą decyzją właściciela.
- **Awaria źródła nie może psuć pulpitu.** Padnięta organizacja nie zabiera
  reszty (`Promise.allSettled`), a brak danych ukrywa całą kartę zamiast
  pokazywać cudzy błąd jako nasz. Odpowiedzi cache'ujemy w `sessionStorage`
  na 6 h.

Zweryfikowane ograniczenia źródła: KSW zwraca najbliższą galę poprawnie, UFC na
darmowym poziomie bywa puste, a **kart walk nie ma** — filtr „gdzie walczą
Polacy" jest z tego źródła niewykonalny. Gdyby był potrzebny, wymaga płatnego
API i funkcji Netlify jako proxy klucza.

## Mobile — reguły z boju

Aplikacja jest używana na telefonie w trakcie pracy, więc to nie jest wariant
zapasowy. Zasady, których nie łam:

- **Responsywność robimy KLASAMI CSS.** Szybsze i nie migocze przy pierwszym
  renderze. `useIsMobile()` (`hooks/use-media-query.ts`) jest wyłącznie dla
  przypadków, w których od szerokości zależy ZACHOWANIE, nie wygląd — dziś
  używa go tylko nawigacja.
- **Nawigacja na telefonie to szuflada**, nie przewijany pasek. Osiem zakładek
  w poziomym pasku zmuszało do szukania celu przewijaniem. Zmiana trasy zamyka
  szufladę — bez tego zostaje otwarta nad nowym widokiem.
- **Kalendarz startuje na telefonie od MIESIĄCA.** Siatka tygodnia potrzebuje
  ~700 px (16 kanałów w wierszach), więc na ekranie 360 px to ciągłe
  przewijanie w bok. Miesiąc ma 7 równych kolumn i mieści się bez przewijania,
  a szczegóły i dodawanie dzieją się w panelu dnia. Wybór jest POCZĄTKOWY:
  pytamy `matchMedia` raz, w inicjalizatorze stanu, a nie przez hook —
  subskrypcja przestawiałaby widok pod palcami przy obrocie telefonu.
- **Akcje w wierszu listy lądują POD treścią na telefonie** (`flex-col
sm:flex-row`), a nie zawijają się w bok. Przyciski w nagłówkach stron biorą
  pełną szerokość (`w-full sm:w-auto`).
- **Nie zmieniaj wysokości komórek kalendarza między ekranami** — zmienia się
  liczba widocznych kropek (`DOTS_MOBILE`), nie wysokość. Inaczej siatka
  skacze przy dociąganiu danych.
- Cele dotykowe: patrz zasada 5 w „Zasady dla agenta". Wysokości okna licz
  w `dvh`, nie `vh`.

## Listy muszą znosić skalę

Realne dane szybko przerastają naiwne widoki. Reguły wyciągnięte z boju:

- **Pulpit pokazuje maksymalnie 5 wierszy na kartę** (`VISIBLE_ROWS`
  w `signal-card.tsx`, `DASHBOARD_ROWS` po stronie strony — strona tnie listę,
  żeby nie budować dziesiątek elementów tylko po to, by je odrzucić), resztę
  chowa pod „…i jeszcze N". **Każda karta pulpitu buduje się na `SignalCard`
  i `SignalRow`** — także ta ze źródłem zewnętrznym. `SignalRow` ma slot
  `trailing` na akcję po prawej, `SignalCard` ma `tone`, `headerBadge`
  i `hideWhenEmpty`; to wystarcza, żeby nie forkować wyglądu karty. Przy 38 zawodnikach
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
