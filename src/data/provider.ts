import type { DataProvider } from '@/data/interfaces'
import { createSupabaseDataProvider } from '@/data/supabase/data-provider'

/**
 * Jedyne miejsce, które decyduje, skąd biorą się dane. Podmiana backendu
 * (inna baza, inny provider) = nowa implementacja interfejsów z `data/interfaces`
 * i zmiana tej jednej linii. UI i hooki nie wymagają zmian.
 */
export const dataProvider: DataProvider = createSupabaseDataProvider()
