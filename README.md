# ggsocialmanager

GG Social Manager — React SPA (Vite + TypeScript + Tailwind v4 + shadcn/ui),
dane w Supabase, hosting na Netlify.

> **Pracujesz nad kodem (człowiek albo agent AI)? Zacznij od [AGENTS.md](./AGENTS.md).**
> Tam są zasady projektu, granice architektoniczne i reguły dotyczące bazy.
> Ten README to tylko szybki start.

## Start

```bash
nvm use             # Node 24 (z .nvmrc)
npm ci
cp .env.example .env.local   # i uzupełnij wartościami z panelu Supabase
npm run dev
```

## Komendy

| Komenda            | Co robi                                         |
| ------------------ | ----------------------------------------------- |
| `npm run dev`      | serwer deweloperski                             |
| `npm run build`    | typecheck + build produkcyjny do `dist/`        |
| `npm run verify`   | typecheck + lint + testy + build (przed commit) |
| `npm test`         | Vitest jednorazowo                              |
| `npm run db:types` | regeneracja typów z bazy (po każdej migracji)   |

## Jak to jest poskładane

- **Warstwa danych jest zamknięta za interfejsami** (`src/data/interfaces.ts`).
  Aplikacja ma zaplanowaną migrację na inną bazę — UI nie zna Supabase.
  Podmiana backendu to jedna linia w `src/data/provider.ts`.
- **Nie ma własnego logowania.** Tożsamość dostarczy aplikacja nadrzędna
  (Google); dziś jest atrapa w `src/lib/auth/identity.tsx`.
- **Baza:** Supabase, schemat `ggsm` (nigdy `public`), migracje w
  `supabase/migrations/`.
- **Deploy:** push na `main` → automatyczny build na Netlify.

Szczegóły i uzasadnienia — [AGENTS.md](./AGENTS.md).
