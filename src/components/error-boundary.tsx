import { Component, type ErrorInfo, type ReactNode } from 'react'

import { Button } from '@/components/ui/button'

type Props = { children: ReactNode }
type State = { error: Error | null }

/**
 * Ostatnia siatka bezpieczeństwa. Bez niej błąd w renderze daje białą stronę
 * bez żadnej informacji — najczęstszy objaw braku zmiennych `VITE_SUPABASE_*`
 * na wdrożeniu.
 *
 * Klasowy komponent, bo React nie ma hookowego odpowiednika `componentDidCatch`.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Nieobsłużony błąd renderowania:', error, info.componentStack)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 p-6">
        <h1 className="text-2xl font-semibold">Coś poszło nie tak</h1>
        <p className="text-muted-foreground text-sm">{error.message}</p>
        <Button onClick={() => window.location.reload()} className="self-start">
          Przeładuj stronę
        </Button>
      </div>
    )
  }
}
