# ggsocialmanager

GG Social Manager — React SPA hostowana na Netlify, dane w Supabase.

Ten plik jest **źródłem prawdy dla agentów AI** (Claude Code, Cursor, Copilot, Codex).
`CLAUDE.md` tylko na niego wskazuje — nie duplikuj treści.

## Stan projektu — przeczytaj najpierw

Projekt jest na etapie **fundamentu**. Działa end-to-end pętla:
przeglądarka → warstwa repozytoriów → Supabase (schemat `ggsm`) → deploy na Netlify.
Pulpit pokazuje sondę połączenia z bazą (`ggsm.app_health`) — to jedyna „funkcja".

**Modelu domenowego jeszcze NIE MA.** Nie zgaduj, czym ma być ta aplikacja i nie
dokładaj tabel „na zapas" — zapytaj właściciela, zanim zaprojektujesz schemat.

Dwie decyzje, które kształtują cały kod (szczegóły niżej):

1. **Aplikacja będzie migrowana na inną bazę i scalona z większą aplikacją.**
   Dlatego dostęp do danych jest od pierwszego commita zamknięty za interfejsami.
2. **Aplikacja nie ma własnego logowania.** Tożsamość dostarczy aplikacja
   nadrzędna (Google). Dziś jest atrapa w jednym pliku.

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
  jest RLS.
- **Każda tabela w `ggsm` musi mieć RLS i jawne polityki.** Domyślne uprawnienia
  w schemacie są odebrane (`alter default privileges ... revoke all`), więc każda
  nowa tabela wymaga świadomego `grant`.
- **Jedyny obecny wyjątek dla `anon`:** `select` na `ggsm.app_health` — sonda
  połączenia, bez danych wrażliwych. Nie dokładaj kolejnych polityk dla `anon`
  bez wyraźnej potrzeby.
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

## Struktura

```text
src/
  components/ui/        # wygenerowane komponenty shadcn (nie ruszaj bez powodu)
  components/           # nasze komponenty aplikacyjne (motyw, error boundary)
  components/layout/    # rama aplikacji (AppShell: nagłówek, treść, stopka)
  pages/                # widoki podpięte pod router
  domain/models.ts      # model domenowy — zero I/O, zero Supabase
  data/interfaces.ts    # kontrakty repozytoriów + DataProvider
  data/supabase/        # implementacja repo na Supabase + mappery Row->domena
  data/provider.ts      # WYBÓR backendu — jedno miejsce
  hooks/                # useHealth, ... — tylko na interfejsach
  lib/auth/identity.tsx # PUNKT WYMIANY TOŻSAMOŚCI (docelowo auth z aplikacji nadrzędnej)
  lib/supabase.ts       # klient przypięty do schematu `ggsm`
  lib/database.types.ts # GENEROWANY z bazy — nie edytuj ręcznie
  lib/utils.ts          # helper cn() od shadcn
  test/setup.ts         # bootstrap Vitest
  App.tsx               # routing
  main.tsx              # providery (theme, identity, router)
supabase/migrations/    # zmiany schematu `ggsm` (nigdy `public`)
```

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
