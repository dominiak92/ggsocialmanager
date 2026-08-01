import { cn } from '@/lib/utils'

/**
 * Ikony Instagrama i Facebooka jako inline SVG.
 *
 * `lucide-react` w wersji 1.x NIE MA ikon marek (usunięto je z pakietu),
 * a dokładanie osobnej biblioteki tylko dla dwóch symboli byłoby przesadą —
 * patrz AGENTS.md, zasada „nie dodawaj bibliotek bez potrzeby". Ścieżki są
 * z oficjalnych znaków marek.
 */
function InstagramGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41 1.27-.06 1.65-.07 4.85-.07M12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63c-.79.3-1.46.72-2.13 1.38C1.35 2.68.93 3.35.63 4.14.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.3.79.72 1.46 1.38 2.13.67.66 1.34 1.08 2.13 1.38.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56.79-.3 1.46-.72 2.13-1.38.66-.67 1.08-1.34 1.38-2.13.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91-.3-.79-.72-1.46-1.38-2.13C21.32 1.35 20.65.93 19.86.63c-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0z" />
      <path d="M12 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32zm0 10.16a4 4 0 1 1 0-8 4 4 0 0 1 0 8z" />
      <circle cx="18.41" cy="5.59" r="1.44" />
    </svg>
  )
}

function FacebookGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.09 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.09 24 18.1 24 12.07z" />
    </svg>
  )
}

type Props = {
  kind: 'instagram' | 'facebook'
  url: string
  /** Nazwa właściciela profilu — trafia do etykiety dla czytnika ekranu. */
  label: string
}

/**
 * Klikalna ikona profilu. Otwiera się w nowej karcie, bo to skok na zewnątrz
 * w środku pracy nad listą — powrót „wstecz" gubiłby przewinięcie i filtry.
 *
 * `stopPropagation` jest konieczne: ikona siedzi w wierszu, którego kliknięcie
 * otwiera edycję. Bez tego przejście na profil otwierałoby też dialog.
 */
export function SocialLink({ kind, url, label }: Props) {
  if (!url) return null

  const Glyph = kind === 'instagram' ? InstagramGlyph : FacebookGlyph
  const name = kind === 'instagram' ? 'Instagram' : 'Facebook'

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer noopener"
      onClick={(event) => event.stopPropagation()}
      data-touch="icon"
      aria-label={`${name}: ${label}`}
      title={`${name}: ${label}`}
      className={cn(
        'text-muted-foreground hover:bg-accent focus-visible:ring-ring inline-flex size-7 shrink-0 items-center justify-center rounded-md transition focus-visible:ring-2 focus-visible:outline-none',
        kind === 'instagram' ? 'hover:text-pink-600' : 'hover:text-blue-600',
      )}
    >
      <Glyph className="size-4" />
    </a>
  )
}
