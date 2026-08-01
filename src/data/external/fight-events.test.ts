import { describe, expect, it } from 'vitest'

import { toFightEvent } from '@/data/external/fight-events'

describe('toFightEvent', () => {
  it('mapuje kompletny wiersz', () => {
    expect(
      toFightEvent(
        {
          idEvent: '2119999',
          strEvent: 'XTB KSW 121',
          dateEvent: '2026-09-19',
          strVenue: 'Atlas Arena',
          strCountry: 'Poland',
        },
        'KSW',
      ),
    ).toEqual({
      id: '2119999',
      name: 'XTB KSW 121',
      startsOn: '2026-09-19',
      organization: 'KSW',
      place: 'Atlas Arena, Poland',
    })
  })

  it('traktuje literał „None" jak pustą wartość', () => {
    // TheSportsDB zwraca „None" zamiast null — bez tego w UI wyświetlałoby się
    // „None, None" jako miejsce gali.
    const result = toFightEvent(
      {
        idEvent: '1',
        strEvent: 'UFC 400',
        dateEvent: '2026-12-12',
        strVenue: 'None',
        strCountry: 'None',
      },
      'UFC',
    )

    expect(result?.place).toBe('')
  })

  it('odrzuca wiersz bez nazwy albo bez daty', () => {
    expect(toFightEvent({ dateEvent: '2026-09-19' }, 'KSW')).toBeNull()
    expect(toFightEvent({ strEvent: 'KSW 122' }, 'KSW')).toBeNull()
  })

  it('odrzuca datę w nieoczekiwanym formacie', () => {
    // Data w innym formacie rozsypałaby liczenie „za ile dni".
    expect(toFightEvent({ strEvent: 'KSW 122', dateEvent: '19-09-2026' }, 'KSW')).toBeNull()
  })

  it('dokleja identyfikator zastępczy, gdy źródło go nie poda', () => {
    const result = toFightEvent({ strEvent: 'KSW 122', dateEvent: '2026-10-10' }, 'KSW')

    expect(result?.id).toBe('KSW-2026-10-10-KSW 122')
  })
})
