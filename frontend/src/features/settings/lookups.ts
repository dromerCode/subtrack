import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { type LookupKind, queryKeys } from '@/lib/queryKeys'
import type { Lookup } from '@/lib/types'

export function useLookups(kind: LookupKind) {
  return useQuery({ queryKey: queryKeys.lookups(kind), queryFn: () => api<Lookup[]>(`/api/${kind}`) })
}

export function useLookupMutations(kind: LookupKind) {
  const queryClient = useQueryClient()
  // Renames and deletes also change what subscriptions and the dashboard show.
  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.lookups(kind) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
    ])
  return {
    create: useMutation({
      mutationFn: (name: string) => api<Lookup>(`/api/${kind}`, { method: 'POST', json: { name } }),
      onSuccess: invalidate,
    }),
    rename: useMutation({
      mutationFn: ({ id, name }: { id: number; name: string }) =>
        api<Lookup>(`/api/${kind}/${id}`, { method: 'PUT', json: { name } }),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: number) => api<void>(`/api/${kind}/${id}`, { method: 'DELETE' }),
      onSuccess: invalidate,
    }),
  }
}
