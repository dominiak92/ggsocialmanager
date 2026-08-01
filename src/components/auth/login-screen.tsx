import { LockIcon } from 'lucide-react'
import { useState, type FormEvent } from 'react'

import { Logo } from '@/components/brand/logo'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useIdentity } from '@/lib/auth/identity'

/**
 * Ekran logowania do bramki na hasło.
 *
 * Komunikat błędu jest celowo wspólny dla złego loginu i złego hasła —
 * rozróżnianie ich podpowiadałoby, która połowa jest poprawna.
 */
export function LoginScreen() {
  const { signIn } = useIdentity()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [failed, setFailed] = useState(false)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setFailed(!signIn(username, password))
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-10">
      <Card className="w-full max-w-sm">
        <CardContent className="space-y-6 pt-2">
          <div className="flex justify-center">
            <Logo />
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-user">Login</Label>
              <Input
                id="login-user"
                value={username}
                autoComplete="username"
                autoFocus
                onChange={(event) => setUsername(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-password">Hasło</Label>
              <Input
                id="login-password"
                type="password"
                value={password}
                autoComplete="current-password"
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>

            {failed && (
              <p
                role="alert"
                className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm"
              >
                Nieprawidłowy login lub hasło.
              </p>
            )}

            <Button type="submit" className="w-full">
              <LockIcon />
              Zaloguj
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
