import { describe, expect, it } from 'vitest'

import { cellKey, daysCovered, groupByCell, groupByDay, sectionsOf } from '@/domain/calendar'
import type { Channel, Publication } from '@/domain/models'

function publication(overrides: Partial<Publication>): Publication {
  return {
    id: 'p1',
    publishOn: '2026-08-04',
    channelId: 'c1',
    postTypeId: null,
    status: 'published',
    title: '',
    note: '',
    url: '',
    eventId: null,
    contestId: null,
    ...overrides,
  }
}

function channel(overrides: Partial<Channel>): Channel {
  return {
    id: 'c1',
    code: 'fb-pl',
    name: 'Fanpage PL',
    platform: 'facebook_page',
    locale: 'PL',
    sortOrder: 0,
    isActive: true,
    reminderAfterDays: 7,
    ...overrides,
  }
}

describe('groupByCell', () => {
  it('zbiera wiele wpisów tego samego dnia i kanału w jedną komórkę', () => {
    const items = [
      publication({ id: 'a' }),
      publication({ id: 'b' }),
      publication({ id: 'c', channelId: 'c2' }),
    ]

    const grouped = groupByCell(items)

    expect(grouped.get(cellKey('2026-08-04', 'c1'))?.map((p) => p.id)).toEqual(['a', 'b'])
    expect(grouped.get(cellKey('2026-08-04', 'c2'))?.map((p) => p.id)).toEqual(['c'])
  })

  it('zwraca pustą mapę dla braku wpisów', () => {
    expect(groupByCell([]).size).toBe(0)
  })
})

describe('groupByDay', () => {
  it('łączy kanały w obrębie dnia', () => {
    const items = [
      publication({ id: 'a', channelId: 'c1' }),
      publication({ id: 'b', channelId: 'c2' }),
      publication({ id: 'c', publishOn: '2026-08-05' }),
    ]

    expect(
      groupByDay(items)
        .get('2026-08-04')
        ?.map((p) => p.id),
    ).toEqual(['a', 'b'])
    expect(
      groupByDay(items)
        .get('2026-08-05')
        ?.map((p) => p.id),
    ).toEqual(['c'])
  })
})

describe('sectionsOf', () => {
  it('grupuje grupę FB i fanpage w jedną sekcję Facebook', () => {
    const channels = [
      channel({ id: '1', platform: 'facebook_group' }),
      channel({ id: '2', platform: 'facebook_page' }),
      channel({ id: '3', platform: 'instagram' }),
      channel({ id: '4', platform: 'tiktok' }),
    ]

    const sections = sectionsOf(channels)

    expect(sections.map((s) => s.group)).toEqual(['facebook', 'instagram', 'other'])
    expect(sections[0]?.channels.map((c) => c.id)).toEqual(['1', '2'])
  })

  it('pomija sekcje bez kanałów, żeby nie zabierały miejsca', () => {
    const sections = sectionsOf([channel({ platform: 'tiktok' })])

    expect(sections.map((s) => s.group)).toEqual(['other'])
  })
})

describe('daysCovered', () => {
  it('liczy dni, nie wpisy', () => {
    const items = [
      publication({ id: 'a', publishOn: '2026-08-04' }),
      publication({ id: 'b', publishOn: '2026-08-04', channelId: 'c2' }),
      publication({ id: 'c', publishOn: '2026-08-06' }),
    ]

    expect(daysCovered(items)).toBe(2)
  })
})
