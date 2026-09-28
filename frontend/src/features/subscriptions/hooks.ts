import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'
import type { Subscription, SubscriptionInput } from '@/lib/types'

export function useSubscriptions() {
  return useQuery({ queryKey: queryKeys.subscriptions, queryFn: () => api<Subscription[]>('/api/subscriptions') })
}

export function useSubscription(id: number) {
  return useQuery({
    queryKey: queryKeys.subscription(id),
    queryFn: () => api<Subscription>(`/api/subscriptions/${id}`),
  })
}

function useInvalidateSubscriptions() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
    ])
}

/** POST when `id` is null, PUT otherwise. */
export function useSaveSubscription(id: number | null) {
  const invalidate = useInvalidateSubscriptions()
  return useMutation({
    mutationFn: (input: SubscriptionInput) =>
      id === null
        ? api<Subscription>('/api/subscriptions', { method: 'POST', json: input })
        : api<Subscription>(`/api/subscriptions/${id}`, { method: 'PUT', json: input }),
    onSuccess: invalidate,
  })
}

export function useDeleteSubscription() {
  const invalidate = useInvalidateSubscriptions()
  return useMutation({
    mutationFn: (id: number) => api<void>(`/api/subscriptions/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  })
}
