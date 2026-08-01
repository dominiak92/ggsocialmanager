import { describe, expect, it } from 'vitest'

import { dailyProgress, dailyTaskGroups, marketsInUse } from '@/domain/daily-tasks'
import type { Channel, DailyTaskCheck, DailyTaskType } from '@/domain/models'

function channel(overrides: Partial<Channel> = {}): Channel {
  return {
    id: 'c1',
    code: 'fb-pl',
    name: 'Fanpage PL',
    platform: 'facebook_page',
    locale: 'PL',
    sortOrder: 20,
    isActive: true,
    reminderAfterDays: 3,
    ...overrides,
  }
}

function type(overrides: Partial<DailyTaskType> = {}): DailyTaskType {
  return {
    id: 't1',
    name: 'Wiadomości',
    hint: '',
    perMarket: true,
    sortOrder: 10,
    isActive: true,
    ...overrides,
  }
}

function check(overrides: Partial<DailyTaskCheck> = {}): DailyTaskCheck {
  return { id: 'k1', taskTypeId: 't1', market: 'PL', doneOn: '2026-08-02', ...overrides }
}

describe('marketsInUse', () => {
  it('bierze rynki z aktywnych kanałów, bez powtórzeń', () => {
    const result = marketsInUse([
      channel({ id: '1', locale: 'PL', sortOrder: 20 }),
      channel({ id: '2', locale: 'PL', sortOrder: 30 }),
      channel({ id: '3', locale: 'DE', sortOrder: 24 }),
    ])

    expect(result).toEqual(['PL', 'DE'])
  })

  it('pomija kanały wyłączone', () => {
    // Inaczej rutyna kazałaby sprawdzać skrzynkę rynku, którego nie prowadzimy,
    // i lista nigdy nie byłaby domknięta.
    const result = marketsInUse([
      channel({ id: '1', locale: 'PL' }),
      channel({ id: '2', locale: 'LT', isActive: false }),
    ])

    expect(result).toEqual(['PL'])
  })

  it('pomija kanały bez rynku', () => {
    expect(marketsInUse([channel({ locale: null, platform: 'tiktok' })])).toEqual([])
  })
})

describe('dailyTaskGroups', () => {
  it('rozkłada zadanie per rynek na jedną pozycję na rynek', () => {
    const [group] = dailyTaskGroups([type()], [], ['PL', 'DE'])

    expect(group?.items.map((item) => item.market)).toEqual(['PL', 'DE'])
  })

  it('zadanie wspólne daje jedną pozycję bez rynku', () => {
    const [group] = dailyTaskGroups([type({ perMarket: false })], [], ['PL', 'DE'])

    expect(group?.items).toHaveLength(1)
    expect(group?.items[0]?.market).toBeNull()
  })

  it('dopina odhaczenie do właściwego rynku', () => {
    const [group] = dailyTaskGroups([type()], [check({ market: 'DE' })], ['PL', 'DE'])

    expect(group?.items[0]?.checkId).toBeNull()
    expect(group?.items[1]?.checkId).toBe('k1')
    expect(group?.doneCount).toBe(1)
  })

  it('pomija zadania wyłączone', () => {
    expect(dailyTaskGroups([type({ isActive: false })], [], ['PL'])).toEqual([])
  })

  it('zadanie per rynek bez ani jednego rynku znika z listy', () => {
    // Nie da się go domknąć, więc psułoby tylko licznik postępu.
    expect(dailyTaskGroups([type()], [], [])).toEqual([])
  })

  it('zadanie wspólne zostaje nawet bez rynków', () => {
    expect(dailyTaskGroups([type({ perMarket: false })], [], [])).toHaveLength(1)
  })
})

describe('dailyProgress', () => {
  it('sumuje pozycje ze wszystkich rodzajów', () => {
    const groups = dailyTaskGroups(
      [type({ id: 'a' }), type({ id: 'b', perMarket: false })],
      [check({ taskTypeId: 'a', market: 'PL' })],
      ['PL', 'DE'],
    )

    expect(dailyProgress(groups)).toEqual({ done: 1, total: 3 })
  })

  it('pusta lista to zero z zera', () => {
    expect(dailyProgress([])).toEqual({ done: 0, total: 0 })
  })
})
