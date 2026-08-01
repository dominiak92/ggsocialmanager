import { useCallback, useEffect, useMemo, useState } from 'react'

import { dataProvider } from '@/data/provider'
import { dailyProgress, dailyTaskGroups, marketsInUse } from '@/domain/daily-tasks'
import type { Channel, DailyTaskCheck, DailyTaskType } from '@/domain/models'
import { useCollection, type CollectionState } from '@/hooks/use-collection'
import { toDateKey } from '@/lib/dates'

/** Pełna lista rodzajów z CRUD-em — wyłącznie dla Ustawień. */
export function useDailyTaskTypes(): CollectionState<
  DailyTaskType,
  { name: string; hint: string; perMarket: boolean; sortOrder: number },
  Partial<{ name: string; hint: string; perMarket: boolean; sortOrder: number; isActive: boolean }>
> {
  return useCollection(dataProvider.dailyTaskTypes, (a, b) => a.sortOrder - b.sortOrder)
}

/**
 * Codzienna rutyna na dziś: rodzaje zadań rozłożone na rynki + odhaczenia.
 *
 * Odhaczenie jest OPTYMISTYCZNE — ptaszek ma zaskoczyć od razu, bo to
 * czynność powtarzana kilkanaście razy dziennie. Gdy zapis padnie, wracamy
 * do stanu sprzed kliknięcia.
 */
export function useDailyTasks(channels: Channel[]) {
  const [types, setTypes] = useState<DailyTaskType[]>([])
  const [checks, setChecks] = useState<DailyTaskCheck[]>([])
  const [loading, setLoading] = useState(true)

  // Dzień liczony raz — inaczej każdy render dawałby nowy klucz zapytania.
  const day = useMemo(() => toDateKey(new Date()), [])

  useEffect(() => {
    let active = true

    Promise.all([dataProvider.dailyTaskTypes.list(), dataProvider.dailyTaskChecks.listForDay(day)])
      .then(([nextTypes, nextChecks]) => {
        if (!active) return
        setTypes(nextTypes)
        setChecks(nextChecks)
      })
      .catch(() => {
        if (active) setTypes([])
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [day])

  const markets = useMemo(() => marketsInUse(channels), [channels])
  const groups = useMemo(() => dailyTaskGroups(types, checks, markets), [types, checks, markets])
  const progress = useMemo(() => dailyProgress(groups), [groups])

  const toggle = useCallback(
    async (taskTypeId: string, market: string | null, checkId: string | null) => {
      if (checkId) {
        setChecks((prev) => prev.filter((check) => check.id !== checkId))
        await dataProvider.dailyTaskChecks.uncheck(checkId).catch(() => {
          // Cofamy optymistyczną zmianę — zadanie jednak nie zostało odhaczone.
          dataProvider.dailyTaskChecks
            .listForDay(day)
            .then(setChecks)
            .catch(() => {})
        })
        return
      }

      const optimistic: DailyTaskCheck = {
        id: `tmp-${taskTypeId}-${market ?? ''}`,
        taskTypeId,
        market,
        doneOn: day,
      }
      setChecks((prev) => [...prev, optimistic])

      try {
        const saved = await dataProvider.dailyTaskChecks.check(taskTypeId, market, day)
        setChecks((prev) => prev.map((check) => (check.id === optimistic.id ? saved : check)))
      } catch {
        setChecks((prev) => prev.filter((check) => check.id !== optimistic.id))
      }
    },
    [day],
  )

  return { groups, progress, loading, toggle }
}
