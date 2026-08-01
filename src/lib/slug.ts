/**
 * Zamiana nazwy na `code` kanału — stabilny klucz techniczny.
 *
 * Polskie znaki rozkładamy przez NFD i zdejmujemy znaki diakrytyczne, żeby
 * „Akademia / Sklep" dało `akademia-sklep`, a nie `akademia-sklep` z ogonkami
 * w środku. Bez tego kody bywają nieporównywalne między systemami.
 */
export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ł/g, 'l')
    .replace(/Ł/g, 'L')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}
