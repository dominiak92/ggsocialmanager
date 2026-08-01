/**
 * Czysta logika kalendarza — grupowanie i statystyki pokrycia.
 * Zero I/O, zero Reacta: to samo liczy siatka tygodnia, miesiąc i pulpit.
 */
import { channelGroupOf, type ChannelGroup } from '@/domain/enums'
import type { Channel, Publication } from '@/domain/models'

/** Klucz komórki siatki: dzień + kanał. */
export function cellKey(dateKey: string, channelId: string): string {
  return `${dateKey}|${channelId}`
}

/** Wpisy pogrupowane po komórce siatki — siatka odpytuje O(1) zamiast filtrować. */
export function groupByCell(publications: Publication[]): Map<string, Publication[]> {
  const map = new Map<string, Publication[]>()
  for (const publication of publications) {
    const key = cellKey(publication.publishOn, publication.channelId)
    const bucket = map.get(key)
    if (bucket) bucket.push(publication)
    else map.set(key, [publication])
  }
  return map
}

/** Wpisy pogrupowane po dniu — pod widok miesiąca i panel dnia. */
export function groupByDay(publications: Publication[]): Map<string, Publication[]> {
  const map = new Map<string, Publication[]>()
  for (const publication of publications) {
    const bucket = map.get(publication.publishOn)
    if (bucket) bucket.push(publication)
    else map.set(publication.publishOn, [publication])
  }
  return map
}

export type ChannelSection = {
  group: ChannelGroup
  channels: Channel[]
}

/**
 * Kanały w sekcjach do siatki. Przy 16 kanałach płaska lista jest nieczytelna,
 * a puste sekcje tylko zabierają miejsce — dlatego wypadają.
 */
export function sectionsOf(channels: Channel[]): ChannelSection[] {
  const order: ChannelGroup[] = ['facebook', 'instagram', 'other']
  return order
    .map((group) => ({
      group,
      channels: channels.filter((channel) => channelGroupOf(channel.platform) === group),
    }))
    .filter((section) => section.channels.length > 0)
}

/** Ile dni w zakresie ma choć jedną publikację (dowolnego kanału). */
export function daysCovered(publications: Publication[]): number {
  return new Set(publications.map((p) => p.publishOn)).size
}
