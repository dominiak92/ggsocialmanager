import { describe, expect, it } from 'vitest'

import { slugify } from '@/lib/slug'

describe('slugify', () => {
  it('zdejmuje polskie znaki diakrytyczne', () => {
    // Ź i Ż oba schodzą do „z" — kolizja jest akceptowalna, bo o unikalność
    // kodu i tak dba ograniczenie `unique` w bazie.
    expect(slugify('Współpraca ĄĘŚĆŹŻÓŃ')).toBe('wspolpraca-aesczzon')
  })

  it('obsługuje ł, którego NFD nie rozkłada', () => {
    expect(slugify('Łódź')).toBe('lodz')
  })

  it('zbija znaki niealfanumeryczne w pojedynczy myślnik', () => {
    expect(slugify('Akademia / Sklep — Blog')).toBe('akademia-sklep-blog')
  })

  it('nie zostawia myślników na brzegach', () => {
    expect(slugify('  --- Fanpage PL ---  ')).toBe('fanpage-pl')
  })

  it('przycina bardzo długie nazwy', () => {
    expect(slugify('a'.repeat(80))).toHaveLength(40)
  })
})
