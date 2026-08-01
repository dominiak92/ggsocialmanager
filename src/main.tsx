// Jawne `/index.css` — bare import bez rozszerzenia nie ma deklaracji typów.
import '@fontsource-variable/geist/index.css'
import './index.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'

import App from '@/App'
import { ErrorBoundary } from '@/components/error-boundary'
import { ThemeProvider } from '@/components/theme-provider'
import { IdentityProvider } from '@/lib/auth/identity'

// Po nowym deployu otwarta karta ma nieaktualne hashe chunków — leniwy import
// podstrony zwraca 404. Przeładuj raz, by pobrać świeży index.html.
window.addEventListener('vite:preloadError', () => {
  if (sessionStorage.getItem('ggsm:reloaded-on-preload-error')) return
  sessionStorage.setItem('ggsm:reloaded-on-preload-error', '1')
  window.location.reload()
})

const root = document.getElementById('root')
if (!root) throw new Error('Brak elementu #root w index.html')

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <IdentityProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </IdentityProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
)
