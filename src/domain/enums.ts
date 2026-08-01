/**
 * Wyliczenia domenowe. Wartości MUSZĄ zgadzać się z ograniczeniami `check`
 * w migracjach — baza jest drugą stroną tego kontraktu.
 */

export const PLATFORMS = [
  'facebook_group',
  'facebook_page',
  'instagram',
  'tiktok',
  'youtube',
  'newsletter',
  'web',
] as const

export type Platform = (typeof PLATFORMS)[number]

export const PLATFORM_LABEL: Record<Platform, string> = {
  facebook_group: 'Grupa FB',
  facebook_page: 'Fanpage FB',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  newsletter: 'Newsletter',
  web: 'WWW',
}

export const LOCALES = ['PL', 'EN', 'CZ', 'RO', 'DE', 'LT'] as const

export type Locale = (typeof LOCALES)[number]

/**
 * Grupy w siatce kalendarza. Przy 16 kanałach płaska lista jest nieczytelna —
 * wiersze zwijają się po grupie, nie po surowej platformie (Grupa FB i Fanpage
 * to dla oka jedna sekcja „Facebook").
 */
export const CHANNEL_GROUPS = ['facebook', 'instagram', 'other'] as const

export type ChannelGroup = (typeof CHANNEL_GROUPS)[number]

export const CHANNEL_GROUP_LABEL: Record<ChannelGroup, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  other: 'Pozostałe',
}

export function channelGroupOf(platform: Platform): ChannelGroup {
  if (platform === 'facebook_group' || platform === 'facebook_page') return 'facebook'
  if (platform === 'instagram') return 'instagram'
  return 'other'
}

export const PUBLICATION_STATUSES = ['planned', 'published'] as const

export type PublicationStatus = (typeof PUBLICATION_STATUSES)[number]

export const PUBLICATION_STATUS_LABEL: Record<PublicationStatus, string> = {
  planned: 'Zaplanowane',
  published: 'Opublikowane',
}

/**
 * Kolory rodzajów postów. Klucz = `post_types.color` z bazy.
 *
 * Trzymamy je jako gotowe klasy Tailwinda, a nie składamy stringów typu
 * `bg-${color}-500` — Tailwind skanuje kod statycznie i takiej klasy by nie
 * wygenerował.
 */
export const POST_TYPE_COLOR: Record<string, string> = {
  amber: 'bg-amber-500/85 text-amber-950 border-amber-600/40',
  blue: 'bg-blue-500/85 text-blue-950 border-blue-600/40',
  violet: 'bg-violet-500/85 text-violet-950 border-violet-600/40',
  teal: 'bg-teal-500/85 text-teal-950 border-teal-600/40',
  pink: 'bg-pink-500/85 text-pink-950 border-pink-600/40',
  orange: 'bg-orange-500/85 text-orange-950 border-orange-600/40',
  cyan: 'bg-cyan-500/85 text-cyan-950 border-cyan-600/40',
  lime: 'bg-lime-500/85 text-lime-950 border-lime-600/40',
  rose: 'bg-rose-500/85 text-rose-950 border-rose-600/40',
  slate: 'bg-slate-500/85 text-slate-950 border-slate-600/40',
}

export function postTypeColorClass(color: string): string {
  return POST_TYPE_COLOR[color] ?? POST_TYPE_COLOR.slate!
}
