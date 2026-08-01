import '@testing-library/jest-dom/vitest'

import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Testing Library nie sprząta samo, gdy `globals: true` bez auto-cleanup.
afterEach(() => {
  cleanup()
})
