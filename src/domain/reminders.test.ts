import { describe, expect, it } from 'vitest'

import type { Athlete, Channel, Contest, Publication, SportEvent } from '@/domain/models'
import {
  athletesDue,
  contestsNeedingAction,
  eventPromo,
  eventsNeedingPromo,
  silentChannels,
} from '@/domain/reminders'

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

function sportEvent(overrides: Partial<SportEvent> = {}): SportEvent {
  return {
    id: 'e1',
    name: 'Gala XYZ 12',
    kind: 'gala',
    startsOn: '2026-08-28',
    endsOn: null,
    place: 'Gdańsk',
    isSponsored: true,
    url: '',
    note: '',
    promoLeadDays: 14,
    ...overrides,
  }
}

function pub(overrides: Partial<Publication> = {}): Publication {
  return {
    id: 'p1',
    publishOn: '2026-08-19',
    channelId: 'ch1',
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

function contest(overrides: Partial<Contest> = {}): Contest {
  return {
    id: 'k1',
    name: 'Konkurs na rashguard',
    channelId: null,
    startsOn: '2026-08-10',
    endsOn: '2026-08-25',
    prize: 'Rashguard',
    status: 'running',
    winnerName: '',
    winnerContact: '',
    winnerAddress: '',
    trackingCode: '',
    url: '',
    note: '',
    ...overrides,
  }
}

function athlete(overrides: Partial<Athlete> = {}): Athlete {
  return {
    id: 'a1',
    name: 'Jan Kowalski',
    discipline: 'BJJ',
    instagramUrl: '',
    otherUrl: '',
    checkEveryDays: 7,
    isActive: true,
    note: '',
    ...overrides,
  }
}

describe('eventPromo', () => {
  it('liczy publikacje i UNIKALNE kanały nagłośnienia', () => {
    const [entry] = eventPromo(
      [sportEvent()],
      [
        pub({ id: 'a', eventId: 'e1', channelId: 'ch1' }),
        pub({ id: 'b', eventId: 'e1', channelId: 'ch1' }),
        pub({ id: 'c', eventId: 'e1', channelId: 'ch2' }),
        pub({ id: 'd', eventId: null, channelId: 'ch3' }),
      ],
      today,
    )

    expect(entry?.promoCount).toBe(3)
    expect(entry?.channelCount).toBe(2)
    expect(entry?.daysUntil).toBe(8)
  })
})

describe('eventsNeedingPromo', () => {
  it('zgłasza event w oknie zapowiedzi bez żadnej publikacji', () => {
    const result = eventsNeedingPromo([sportEvent()], [], today)

    expect(result).toHaveLength(1)
    expect(result[0]?.daysUntil).toBe(8)
  })

  it('milczy, gdy event ma choć jedną publikację', () => {
    const result = eventsNeedingPromo([sportEvent()], [pub({ eventId: 'e1' })], today)

    expect(result).toEqual([])
  })

  it('milczy, gdy do eventu jest dalej niż okno zapowiedzi', () => {
    const result = eventsNeedingPromo(
      [sportEvent({ startsOn: '2026-10-01', promoLeadDays: 14 })],
      [],
      today,
    )

    expect(result).toEqual([])
  })

  it('pomija eventy, które już się zaczęły — na alarm za późno', () => {
    const result = eventsNeedingPromo([sportEvent({ startsOn: '2026-08-19' })], [], today)

    expect(result).toEqual([])
  })

  it('sortuje najbliższe pierwsze', () => {
    const result = eventsNeedingPromo(
      [
        sportEvent({ id: 'daleki', startsOn: '2026-08-30' }),
        sportEvent({ id: 'bliski', startsOn: '2026-08-22' }),
      ],
      [],
      today,
    )

    expect(result.map((entry) => entry.event.id)).toEqual(['bliski', 'daleki'])
  })
})

describe('contestsNeedingAction', () => {
  it('milczy o konkursie z wysłaną nagrodą', () => {
    expect(contestsNeedingAction([contest({ status: 'sent' })], today)).toEqual([])
  })

  it('milczy o trwającym konkursie z odległym terminem', () => {
    expect(contestsNeedingAction([contest({ endsOn: '2026-09-15' })], today)).toEqual([])
  })

  it('ostrzega, gdy termin za dwa dni', () => {
    const result = contestsNeedingAction([contest({ endsOn: '2026-08-22' })], today)

    expect(result[0]?.reason).toBe('ends-soon')
  })

  it('zgłasza konkurs po terminie, który wciąż jest otwarty', () => {
    const result = contestsNeedingAction([contest({ endsOn: '2026-08-15' })], today)

    expect(result[0]?.reason).toBe('overdue')
    expect(result[0]?.daysUntilEnd).toBe(-5)
  })

  it('zgłasza nagrodę czekającą na wysyłkę mimo terminu w przyszłości', () => {
    const result = contestsNeedingAction(
      [contest({ status: 'picked', endsOn: '2026-09-30' })],
      today,
    )

    expect(result[0]?.reason).toBe('prize-waiting')
  })

  it('daje jeden powód na konkurs, nie duplikuje wpisów', () => {
    const result = contestsNeedingAction(
      [contest({ status: 'picking', endsOn: '2026-08-15' })],
      today,
    )

    expect(result).toHaveLength(1)
    expect(result[0]?.reason).toBe('winner-waiting')
  })
})

describe('athletesDue', () => {
  it('zgłasza zawodnika po przekroczeniu jego rytmu', () => {
    const result = athletesDue([athlete()], new Map([['a1', '2026-08-10']]), today)

    expect(result[0]?.daysSince).toBe(10)
    expect(result[0]?.overdueBy).toBe(3)
  })

  it('milczy dokładnie w dniu, w którym rytm dobiega końca', () => {
    expect(athletesDue([athlete()], new Map([['a1', '2026-08-13']]), today)).toEqual([])
  })

  it('nigdy niesprawdzony trafia na górę', () => {
    const result = athletesDue(
      [athlete({ id: 'stary' }), athlete({ id: 'nowy' })],
      new Map([['stary', '2026-07-01']]),
      today,
    )

    expect(result[0]?.athlete.id).toBe('nowy')
  })

  it('pomija nieaktywnych i tych z rytmem 0', () => {
    const result = athletesDue(
      [athlete({ id: 'x', isActive: false }), athlete({ id: 'y', checkEveryDays: 0 })],
      new Map(),
      today,
    )

    expect(result).toEqual([])
  })
})
