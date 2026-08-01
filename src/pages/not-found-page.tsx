import { Link } from 'react-router'

import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <div className="space-y-4 py-16 text-center">
      <p className="text-muted-foreground text-6xl font-semibold">404</p>
      <h1 className="text-2xl font-semibold tracking-tight">Nie ma takiej strony</h1>
      <Button asChild>
        <Link to="/">Wróć na pulpit</Link>
      </Button>
    </div>
  )
}
