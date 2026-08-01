import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { WeekGrid } from '@/components/calendar/week-grid'
import type { Channel, PostType, Publication } from '@/domain/models'
import { weekDays } from '@/lib/dates'

const days = weekDays(new Date(2026, 7, 5)) // tydzień 3–9 sierpnia 2026

const channels: Channel[] = [
  {
    id: 'ch-fb',
    code: 'fb-pl',
    name: 'Fanpage PL',
    platform: 'facebook_page',
    locale: 'PL',
    sortOrder: 20,
    isActive: true,
  },
  {
    id: 'ch-ig',
    code: 'ig-pl',
    name: 'Instagram PL',
    platform: 'instagram',
    locale: 'PL',
    sortOrder: 30,
    isActive: true,
  },
]

const postTypes: PostType[] = [
  { id: 'pt-news', code: 'news', name: 'News', color: 'blue', sortOrder: 20, isActive: true },
]

function publication(overrides: Partial<Publication> = {}): Publication {
  return {
    id: 'pub-1',
    publishOn: '2026-08-05',
    channelId: 'ch-fb',
    postTypeId: 'pt-news',
    status: 'published',
    title: 'Rashguard Ronin',
    note: '',
    url: '',
    ...overrides,
  }
}

function setup(publications: Publication[] = []) {
  const onAdd = vi.fn()
  const onOpen = vi.fn()
  render(
    <WeekGrid
      days={days}
      channels={channels}
      postTypes={postTypes}
      publications={publications}
      onAdd={onAdd}
      onOpen={onOpen}
    />,
  )
  return { onAdd, onOpen }
}

describe('WeekGrid', () => {
  it('grupuje kanały w sekcje i pokazuje 7 dni', () => {
    setup()

    expect(screen.getByText('Facebook')).toBeInTheDocument()
    expect(screen.getByText('Instagram')).toBeInTheDocument()
    expect(screen.getByRole('rowheader', { name: 'Fanpage PL' })).toBeInTheDocument()
    // 7 dni + kolumna „Kanał"
    expect(screen.getAllByRole('columnheader')).toHaveLength(8)
  })

  it('pokazuje wpis w komórce właściwego kanału i dnia', () => {
    setup([publication()])

    expect(screen.getByRole('button', { name: /Rashguard Ronin/ })).toBeInTheDocument()
  })

  it('klik w pustą komórkę przekazuje dzień i kanał', async () => {
    const { onAdd } = setup()

    await userEvent.click(
      screen.getByRole('button', { name: 'Dodaj wpis: Instagram PL, 2026-08-06' }),
    )

    expect(onAdd).toHaveBeenCalledWith('2026-08-06', 'ch-ig')
  })

  it('klik w istniejący wpis otwiera go do edycji', async () => {
    const entry = publication()
    const { onOpen } = setup([entry])

    await userEvent.click(screen.getByRole('button', { name: /Rashguard Ronin/ }))

    expect(onOpen).toHaveBeenCalledWith(entry)
  })

  it('informuje, gdy wszystkie kanały są wyłączone', () => {
    render(
      <WeekGrid
        days={days}
        channels={[]}
        postTypes={postTypes}
        publications={[]}
        onAdd={vi.fn()}
        onOpen={vi.fn()}
      />,
    )

    expect(screen.getByText(/Wszystkie kanały są wyłączone/)).toBeInTheDocument()
  })
})
