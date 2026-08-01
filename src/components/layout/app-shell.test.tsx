import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AppShell } from '@/components/layout/app-shell'

/**
 * `matchMedia` nie istnieje w jsdom — musimy je podstawić, żeby dało się
 * przetestować zachowanie zależne od szerokości ekranu.
 */
function setScreen(mobile: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: mobile && query.includes('max-width'),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onchange: null,
    })),
  )
}

function renderShell() {
  return render(
    <MemoryRouter>
      <AppShell>
        <p>treść</p>
      </AppShell>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.unstubAllGlobals()
})

describe('AppShell na szerokim ekranie', () => {
  it('pokazuje pasek nawigacji, bez przycisku menu', () => {
    setScreen(false)
    renderShell()

    expect(screen.queryByRole('button', { name: 'Menu' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Kalendarz/ })).toBeInTheDocument()
  })
})

describe('AppShell na telefonie', () => {
  it('chowa pasek za przyciskiem menu', () => {
    setScreen(true)
    renderShell()

    expect(screen.getByRole('button', { name: 'Menu' })).toBeInTheDocument()
    // Osiem zakładek nie może zajmować nagłówka na 360 px.
    expect(screen.queryByRole('link', { name: /Kalendarz/ })).not.toBeInTheDocument()
  })

  it('szuflada wypisuje wszystkie osiem zakładek', async () => {
    setScreen(true)
    renderShell()

    await userEvent.click(screen.getByRole('button', { name: 'Menu' }))

    const drawer = await screen.findByRole('dialog')
    expect(within(drawer).getAllByRole('link')).toHaveLength(8)
    expect(within(drawer).getByRole('link', { name: /Nagrywki/ })).toBeInTheDocument()
  })
})
