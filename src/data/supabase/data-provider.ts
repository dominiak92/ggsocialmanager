/**
 * Implementacja kontraktów z `data/interfaces` na Supabase.
 *
 * To JEDYNY katalog w projekcie, który importuje klienta Supabase.
 * Jeśli piszesz `from '@/lib/supabase'` gdziekolwiek indziej — robisz to źle.
 */
import type { DataProvider, HealthRepo } from '@/data/interfaces'
import { toHealthCheck } from '@/data/supabase/mappers'
import { supabase } from '@/lib/supabase'

const health: HealthRepo = {
  async get() {
    const { data, error } = await supabase
      .from('app_health')
      .select('id, label, checked_at')
      .order('checked_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw new Error(`Nie udało się odczytać sondy połączenia: ${error.message}`)

    return data ? toHealthCheck(data) : null
  },
}

export function createSupabaseDataProvider(): DataProvider {
  return { health }
}
