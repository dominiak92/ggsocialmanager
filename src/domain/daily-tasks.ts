/**
 * Rozłożenie codziennej rutyny na konkretne pozycje do odhaczenia.
 * Czysta logika, bez I/O — dzięki temu da się ją przetestować.
 */
import type { Channel, DailyTaskCheck, DailyTaskType } from '@/domain/models'

/** Jedna pozycja do odhaczenia: rodzaj zadania w konkretnym rynku (albo bez). */
export type DailyTaskItem = {
  type: DailyTaskType
  /** `null` dla zadań wspólnych dla całej marki. */
  market: string | null
  /** Identyfikator odhaczenia, gdy zrobione; `null`, gdy jeszcze nie. */
  checkId: string | null
}

export type DailyTaskGroup = {
  type: DailyTaskType
  items: DailyTaskItem[]
  doneCount: number
}

/**
 * Rynki, na których realnie pracujemy — czytane z AKTYWNYCH kanałów.
 *
 * Nie ze stałej listy `LOCALES`: gdyby ktoś wyłączył wszystkie kanały LT,
 * codzienna rutyna nadal kazałaby sprawdzać skrzynkę litewską i lista nigdy
 * nie byłaby domknięta.
 */
export function marketsInUse(channels: Channel[]): string[] {
  const seen = new Map<string, number>()
  for (const channel of channels) {
    if (!channel.isActive || !channel.locale) continue
    if (!seen.has(channel.locale)) seen.set(channel.locale, channel.sortOrder)
  }

  return [...seen.entries()]
    .toSorted((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]))
    .map(([locale]) => locale)
}

/**
 * Zadania dnia pogrupowane po rodzaju.
 *
 * Zadanie `perMarket` rozkłada się na jedną pozycję per rynek, pozostałe dają
 * jedną pozycję z `market === null`. Rodzaj bez ani jednego rynku (bo wszystkie
 * kanały wyłączone) znika z listy — nie da się go domknąć, więc tylko psułby
 * licznik postępu.
 */
export function dailyTaskGroups(
  types: DailyTaskType[],
  checks: DailyTaskCheck[],
  markets: string[],
): DailyTaskGroup[] {
  const byKey = new Map(checks.map((check) => [`${check.taskTypeId}|${check.market ?? ''}`, check]))

  return types
    .filter((type) => type.isActive)
    .map((type) => {
      const slots = type.perMarket ? markets : [null]
      const items = slots.map((market) => ({
        type,
        market,
        checkId: byKey.get(`${type.id}|${market ?? ''}`)?.id ?? null,
      }))

      return { type, items, doneCount: items.filter((item) => item.checkId !== null).length }
    })
    .filter((group) => group.items.length > 0)
}

/** Ile pozycji dnia jest odhaczonych i ile ich w ogóle jest. */
export function dailyProgress(groups: DailyTaskGroup[]): { done: number; total: number } {
  return groups.reduce(
    (acc, group) => ({
      done: acc.done + group.doneCount,
      total: acc.total + group.items.length,
    }),
    { done: 0, total: 0 },
  )
}
