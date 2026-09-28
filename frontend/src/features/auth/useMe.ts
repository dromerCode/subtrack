import { useQuery } from '@tanstack/react-query'
import { ApiError, api } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'
import type { Me } from '@/lib/types'

/** The logged-in user, or null when there is no session. */
export function useMe() {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: async (): Promise<Me | null> => {
      try {
        return await api<Me>('/api/auth/me')
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) return null
        throw error
      }
    },
    staleTime: Infinity,
  })
}
