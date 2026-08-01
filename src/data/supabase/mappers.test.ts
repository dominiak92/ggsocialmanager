import { describe, expect, it } from 'vitest'

import { toHealthCheck } from '@/data/supabase/mappers'

describe('toHealthCheck', () => {
  it('przepisuje snake_case z bazy na camelCase domeny', () => {
    const row = {
      id: '00000000-0000-0000-0000-000000000001',
      label: 'ggsm: połączenie z bazą',
      checked_at: '2026-08-01T10:00:00.000Z',
    }

    expect(toHealthCheck(row)).toEqual({
      id: '00000000-0000-0000-0000-000000000001',
      label: 'ggsm: połączenie z bazą',
      checkedAt: '2026-08-01T10:00:00.000Z',
    })
  })

  it('nie przepuszcza kolumn spoza modelu domenowego', () => {
    // Kolumna, której domena nie zna — nie może wyciec do UI.
    const row = {
      id: 'a',
      label: 'b',
      checked_at: '2026-08-01T10:00:00.000Z',
      internal_secret: 'nie-dla-ui',
    }

    expect(Object.keys(toHealthCheck(row)).toSorted()).toEqual(['checkedAt', 'id', 'label'])
  })
})
