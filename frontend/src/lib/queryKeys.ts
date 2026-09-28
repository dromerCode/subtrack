export type LookupKind = 'categories' | 'payment-methods'

export const queryKeys = {
  me: ['me'],
  subscriptions: ['subscriptions'],
  subscription: (id: number) => ['subscriptions', id],
  dashboard: ['dashboard'],
  lookups: (kind: LookupKind) => ['lookups', kind],
} as const
