import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { PublicationDialog } from '@/components/calendar/publication-dialog'
import type { Channel, PostType, Publication } from '@/domain/models'

const channels: Channel[] = [
  {
    id: 'fb-pl',
    code: 'fb-pl',
    name: 'Fanpage PL',
    platform: 'facebook_page',
    locale: 'PL',
    sortOrder: 20,
    isActive: true,
    reminderAfterDays: 3,
  },
  {
    id: 'fb-de',
    code: 'fb-de',
    name: 'Fanpage DE',
    platform: 'facebook_page',
    locale: 'DE',
    sortOrder: 24,
    isActive: true,
    reminderAfterDays: 14,
  },
  {
    id: 'ig-pl',
    code: 'ig-pl',
    name: 'Instagram PL',
    platform: 'instagram',
    locale: 'PL',
    sortOrder: 30,
    isActive: true,
    reminderAfterDays: 3,
  },
  {
    id: 'tiktok',
    code: 'tiktok',
    name: 'TikTok',
    platform: 'tiktok',
    locale: null,
    sortOrder: 40,
    isActive: true,
    reminderAfterDays: 7,
  },
]

const postTypes: PostType[] = [
  { id: 'pt-news', code: 'news', name: 'News', color: 'blue', sortOrder: 20, isActive: true },
]

function setup(target: Parameters<typeof PublicationDialog>[0]['target']) {
  const onCreate = vi.fn().mockResolvedValue(undefined)
  const onUpdate = vi.fn().mockResolvedValue(undefined)

  render(
    <PublicationDialog
      target={target}
      channels={channels}
      postTypes={postTypes}
      events={[]}
      contests={[]}
      onClose={vi.fn()}
      onCreate={onCreate}
      onUpdate={onUpdate}
      onDelete={vi.fn()}
    />,
  )

  return { onCreate, onUpdate }
}

const createTarget = { mode: 'create', publishOn: '2026-08-05', channelId: 'fb-pl' } as const

describe('PublicationDialog — dodawanie na kilka kanałów', () => {
  it('startuje z zaznaczonym kanałem klikniętej kratki', () => {
    setup(createTarget)

    expect(screen.getByRole('checkbox', { name: 'Fanpage PL' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Fanpage DE' })).not.toBeChecked()
  })

  it('zapisuje po jednym wpisie na każdy zaznaczony kanał', async () => {
    const { onCreate } = setup(createTarget)

    await userEvent.click(screen.getByRole('checkbox', { name: 'Fanpage DE' }))
    await userEvent.click(screen.getByRole('button', { name: /Zapisz/ }))

    expect(onCreate).toHaveBeenCalledTimes(1)
    const drafts = onCreate.mock.calls[0]![0] as { channelId: string; publishOn: string }[]
    expect(drafts.map((draft) => draft.channelId)).toEqual(['fb-pl', 'fb-de'])
    // Dzień i reszta treści są wspólne — to ta sama rzecz w dwóch miejscach.
    expect(drafts.every((draft) => draft.publishOn === '2026-08-05')).toBe(true)
  })

  it('przycisk mówi, ile wpisów powstanie', async () => {
    setup(createTarget)

    await userEvent.click(screen.getByRole('checkbox', { name: 'Fanpage DE' }))

    expect(screen.getByRole('button', { name: 'Zapisz w 2 kanałach' })).toBeInTheDocument()
  })

  it('skrót rynku zaznacza kanały tylko tego rynku, bez kanałów bez rynku', async () => {
    const { onCreate } = setup(createTarget)

    // „PL" ma dobrać Instagram PL (Fanpage PL jest już zaznaczony),
    // ale NIE TikToka, który nie należy do żadnego rynku.
    await userEvent.click(screen.getByRole('button', { name: 'PL' }))
    await userEvent.click(screen.getByRole('button', { name: /Zapisz/ }))

    const drafts = onCreate.mock.calls[0]![0] as { channelId: string }[]
    expect(drafts.map((draft) => draft.channelId).toSorted()).toEqual(['fb-pl', 'ig-pl'])
  })

  it('ponowne kliknięcie rynku odznacza — skrót przełącza, nie tylko dodaje', async () => {
    setup(createTarget)

    await userEvent.click(screen.getByRole('button', { name: 'PL' }))
    await userEvent.click(screen.getByRole('button', { name: 'PL' }))

    expect(screen.getByRole('checkbox', { name: 'Fanpage PL' })).not.toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Instagram PL' })).not.toBeChecked()
  })

  it('nie da się zapisać bez żadnego kanału', async () => {
    const { onCreate } = setup(createTarget)

    await userEvent.click(screen.getByRole('checkbox', { name: 'Fanpage PL' }))

    expect(screen.getByRole('button', { name: /Zapisz/ })).toBeDisabled()
    expect(onCreate).not.toHaveBeenCalled()
  })
})

describe('PublicationDialog — edycja', () => {
  const publication: Publication = {
    id: 'p1',
    publishOn: '2026-08-05',
    channelId: 'fb-pl',
    postTypeId: null,
    status: 'published',
    title: 'Coś',
    note: '',
    url: '',
    eventId: null,
    contestId: null,
  }

  it('pokazuje pojedynczy wybór, nie checkboxy', () => {
    setup({ mode: 'edit', publication })

    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Kanał' })).toBeInTheDocument()
  })

  it('zapisuje jako aktualizację jednego wpisu', async () => {
    const { onUpdate, onCreate } = setup({ mode: 'edit', publication })

    await userEvent.click(screen.getByRole('button', { name: /Zapisz/ }))

    expect(onCreate).not.toHaveBeenCalled()
    expect(onUpdate).toHaveBeenCalledWith('p1', expect.objectContaining({ channelId: 'fb-pl' }))
  })
})
