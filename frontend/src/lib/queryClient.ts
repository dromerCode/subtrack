import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import i18n from '@/i18n'
import { ApiError } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'

/** Statuses each screen shows itself (form errors, "not found"); anything else gets a generic toast. */
const HANDLED_BY_SCREEN = new Set([400, 404, 409])

function handleError(client: QueryClient, error: Error) {
  if (error instanceof ApiError && error.status === 401) {
    // Session gone: RequireAuth sees "no user" and sends us to the login page.
    client.setQueryData(queryKeys.me, null)
    return
  }
  if (error instanceof ApiError && HANDLED_BY_SCREEN.has(error.status)) return
  toast.error(i18n.t('errors.generic'), {
    action: { label: i18n.t('errors.reload'), onClick: () => window.location.reload() },
  })
}

export function createQueryClient(): QueryClient {
  const client: QueryClient = new QueryClient({
    queryCache: new QueryCache({ onError: (error) => handleError(client, error) }),
    mutationCache: new MutationCache({ onError: (error) => handleError(client, error) }),
    defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
  })
  return client
}
