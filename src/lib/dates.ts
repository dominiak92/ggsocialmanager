/**
 * Praca z datami kalendarza.
 *
 * NAJWAŻNIEJSZA ZASADA: dzień publikacji to DATA, nie moment w czasie.
 * Dlatego klucz dnia składamy z lokalnych komponentów daty, a NIE przez
 * `toISOString()` — ten konwertuje do UTC i w Polsce (UTC+1/+2) przesuwa
 * wieczorne wpisy na poprzedni dzień.
 */

/** `YYYY-MM-DD` z lokalnej daty. */
export function toDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** `YYYY-MM-DD` → lokalna północ. */
export function fromDateKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1)
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

export function addMonths(date: Date, months: number): Date {
  // Dzień 1 przed przesunięciem — inaczej 31 marca minus miesiąc daje 3 marca.
  return new Date(date.getFullYear(), date.getMonth() + months, 1)
}

/** Poniedziałek tygodnia, w którym leży `date`. */
export function startOfWeek(date: Date): Date {
  const day = date.getDay() // 0 = niedziela
  const shift = day === 0 ? -6 : 1 - day
  return addDays(new Date(date.getFullYear(), date.getMonth(), date.getDate()), shift)
}

/** 7 kolejnych dni od poniedziałku. */
export function weekDays(anyDayOfWeek: Date): Date[] {
  const start = startOfWeek(anyDayOfWeek)
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

/**
 * Siatka miesiąca: pełne tygodnie od poniedziałku, z doklejonymi dniami
 * sąsiednich miesięcy. Zawsze 6 rzędów — dzięki temu wysokość kalendarza
 * nie skacze przy przewijaniu miesięcy.
 */
export function monthGrid(date: Date): Date[] {
  const first = new Date(date.getFullYear(), date.getMonth(), 1)
  const start = startOfWeek(first)
  return Array.from({ length: 42 }, (_, i) => addDays(start, i))
}

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
}

export function isToday(date: Date): boolean {
  return toDateKey(date) === toDateKey(new Date())
}

/** Ile dni dzieli `to` od `from` (dodatnie = w przyszłości). */
export function daysBetween(from: Date, to: Date): number {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime()
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime()
  return Math.round((b - a) / 86_400_000)
}

const WEEKDAY_SHORT = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd']

/** `Pn` … `Nd` — indeks liczony od poniedziałku, jak w siatce. */
export function weekdayShort(date: Date): string {
  const day = date.getDay()
  return WEEKDAY_SHORT[day === 0 ? 6 : day - 1]!
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay()
  return day === 0 || day === 6
}

export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })
}

export function formatDayLong(date: Date): string {
  return date.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })
}

/** Podpis zakresu tygodnia, np. `4–10 sierpnia 2026`. */
export function formatWeekRange(start: Date): string {
  const end = addDays(start, 6)
  const sameMonth = isSameMonth(start, end)
  const left = sameMonth
    ? String(start.getDate())
    : start.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' })
  const right = end.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })
  return `${left}–${right}`
}
