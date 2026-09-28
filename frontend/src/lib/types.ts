export type IntervalUnit = 'DAY' | 'WEEK' | 'MONTH' | 'YEAR'

export const INTERVAL_UNITS: IntervalUnit[] = ['DAY', 'WEEK', 'MONTH', 'YEAR']

export interface Me {
  username: string
}

export interface Lookup {
  id: number
  name: string
}

export interface Subscription {
  id: number
  name: string
  price: number
  intervalCount: number
  intervalUnit: IntervalUnit
  anchorDate: string
  sharedWith: number
  category: Lookup | null
  paymentMethod: Lookup | null
  notes: string | null
  active: boolean
  createdAt: string
  updatedAt: string
  yourShare: number
  monthlyCost: number
  yearlyCost: number
  nextChargeDate: string | null
}

export interface SubscriptionInput {
  name: string
  price: number | null
  intervalCount: number
  intervalUnit: IntervalUnit
  anchorDate: string
  sharedWith: number
  categoryId: number | null
  paymentMethodId: number | null
  notes: string | null
  active: boolean
}

export interface Dashboard {
  monthlyTotal: number
  yearlyTotal: number
  upcoming: { id: number; name: string; date: string; yourShare: number }[]
  byCategory: { categoryId: number | null; name: string | null; monthly: number }[]
}
