import { describe, expect, it } from 'vitest'

import type { Channel } from '@/domain/models'
import { silentChannels } from '@/domain/reminders'

const today = new Date(2026, 7, 20) // 2026-08-20

function channel(overrides: Partial<Channel> = {}): Channel {
  return {
    id: 'c1',
    code: 'ig-pl',
    name: 'Instagram PL',
    platform: 'instagram',
    locale: 'PL',
    sortOrder: 30,
    isActive: true,
    reminderAfterDays: 3,
    ...overrides,
  }
}

describe('silentChannels', () => {
  it('milczy dokładnie tyle, ile wynosi próg — jeszcze nie alarmuje', () => {
    const result = silentChannels(
      [channel({ reminderAfterDays: 3 })],
      new Map([['c1', '2026-08-17']]), // 3 dni temu
      today,
    )

    expect(result).toEqual([])
  })

  it('alarmuje dzień po przekroczeniu progu', () => {
    const result = silentChannels(
      [channel({ reminderAfterDays: 3 })],
      new Map([['c1', '2026-08-16']]), // 4 dni temu
      today,
    )

    expect(result).toHaveLength(1)
    expect(result[0]?.daysSince).toBe(4)
    expect(result[0]?.overdueBy).toBe(1)
  })

  it('kanał bez żadnej publikacji trafia na samą górę', () => {
    const result = silentChannels(
      [
        channel({ id: 'stary', reminderAfterDays: 3 }),
        channel({ id: 'nigdy', reminderAfterDays: 3 }),
      ],
      new Map([['stary', '2026-01-01']]),
      today,
    )

    expect(result[0]?.channel.id).toBe('nigdy')
    expect(result[0]?.daysSince).toBeNull()
  })

  it('sortuje wg przekroczenia progu, nie wg samych dni ciszy', () => {
    // Newsletter milczy dłużej w dniach, ale ma na to zgodę — Instagram
    // przekroczył swój próg mocniej i to on jest pilniejszy.
    const result = silentChannels(
      [channel({ id: 'ig', reminderAfterDays: 3 }), channel({ id: 'nl', reminderAfterDays: 30 })],
      new Map([
        ['ig', '2026-07-21'], // 30 dni ciszy, próg 3 → przekroczenie 27
        ['nl', '2026-07-11'], // 40 dni ciszy, próg 30 → przekroczenie 10
      ]),
      today,
    )

    expect(result.map((entry) => entry.channel.id)).toEqual(['ig', 'nl'])
  })

  it('pomija kanały wyłączone', () => {
    const result = silentChannels([channel({ isActive: false })], new Map(), today)

    expect(result).toEqual([])
  })

  it('próg 0 wyłącza przypominanie dla kanału', () => {
    const result = silentChannels([channel({ reminderAfterDays: 0 })], new Map(), today)

    expect(result).toEqual([])
  })
})
