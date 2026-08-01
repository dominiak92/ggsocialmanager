import { describe, expect, it } from 'vitest'

import {
  addMonths,
  daysBetween,
  formatWeekRange,
  monthGrid,
  startOfWeek,
  toDateKey,
  weekDays,
  weekdayShort,
} from '@/lib/dates'

describe('toDateKey', () => {
  it('używa daty lokalnej, nie UTC', () => {
    // 23:30 czasu lokalnego. `toISOString()` cofnąłby to na poprzedni dzień
    // w każdej strefie na wschód od UTC — czyli w Polsce zawsze.
    const late = new Date(2026, 7, 4, 23, 30)
    expect(toDateKey(late)).toBe('2026-08-04')
  })

  it('dopełnia zerami miesiąc i dzień', () => {
    expect(toDateKey(new Date(2026, 0, 9))).toBe('2026-01-09')
  })
})

describe('startOfWeek', () => {
  it('zwraca poniedziałek dla dnia w środku tygodnia', () => {
    // 2026-08-06 to czwartek.
    expect(toDateKey(startOfWeek(new Date(2026, 7, 6)))).toBe('2026-08-03')
  })

  it('dla niedzieli cofa się do poniedziałku TEGO tygodnia, nie następnego', () => {
    // 2026-08-09 to niedziela — najczęstszy błąd przy `getDay() === 0`.
    expect(toDateKey(startOfWeek(new Date(2026, 7, 9)))).toBe('2026-08-03')
  })

  it('dla poniedziałku zwraca ten sam dzień', () => {
    expect(toDateKey(startOfWeek(new Date(2026, 7, 3)))).toBe('2026-08-03')
  })
})

describe('weekDays', () => {
  it('daje 7 kolejnych dni od poniedziałku', () => {
    const days = weekDays(new Date(2026, 7, 6)).map(toDateKey)
    expect(days).toEqual([
      '2026-08-03',
      '2026-08-04',
      '2026-08-05',
      '2026-08-06',
      '2026-08-07',
      '2026-08-08',
      '2026-08-09',
    ])
  })
})

describe('weekdayShort', () => {
  it('liczy od poniedziałku', () => {
    expect(weekdayShort(new Date(2026, 7, 3))).toBe('Pn')
    expect(weekdayShort(new Date(2026, 7, 9))).toBe('Nd')
  })
})

describe('monthGrid', () => {
  it('zawsze ma 42 dni, żeby wysokość kalendarza nie skakała', () => {
    expect(monthGrid(new Date(2026, 7, 1))).toHaveLength(42)
    expect(monthGrid(new Date(2026, 1, 1))).toHaveLength(42)
  })

  it('zaczyna się poniedziałkiem obejmującym 1. dzień miesiąca', () => {
    // 1 sierpnia 2026 to sobota → siatka startuje 27 lipca.
    expect(toDateKey(monthGrid(new Date(2026, 7, 1))[0]!)).toBe('2026-07-27')
  })
})

describe('addMonths', () => {
  it('nie przeskakuje miesiąca przy 31. dniu', () => {
    // Naiwne `setMonth(-1)` na 31 marca dałoby 3 marca (bo luty jest krótszy).
    expect(toDateKey(addMonths(new Date(2026, 2, 31), -1))).toBe('2026-02-01')
  })
})

describe('daysBetween', () => {
  it('liczy pełne dni niezależnie od pory', () => {
    expect(daysBetween(new Date(2026, 7, 1, 23, 0), new Date(2026, 7, 8, 1, 0))).toBe(7)
  })

  it('zwraca wartość ujemną dla przeszłości', () => {
    expect(daysBetween(new Date(2026, 7, 8), new Date(2026, 7, 1))).toBe(-7)
  })
})

describe('formatWeekRange', () => {
  it('skraca lewą stronę, gdy tydzień nie przechodzi przez miesiąc', () => {
    expect(formatWeekRange(new Date(2026, 7, 3))).toBe('3–9 sierpnia 2026')
  })

  it('pokazuje oba miesiące, gdy tydzień je przecina', () => {
    expect(formatWeekRange(new Date(2026, 6, 27))).toBe('27 lipca–2 sierpnia 2026')
  })
})
