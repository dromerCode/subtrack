import { QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import '@/i18n'
import './index.css'
import { AppRoutes } from '@/AppRoutes'
import { Toaster } from '@/components/ui/sonner'
import { createQueryClient } from '@/lib/queryClient'

const queryClient = createQueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
      <Toaster />
    </QueryClientProvider>
  </StrictMode>,
)
