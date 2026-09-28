export interface FieldError {
  field: string
  code: string
}

/** RFC 9457 problem details as returned by the backend. */
export interface Problem {
  status: number
  title?: string
  detail?: string
  errors?: FieldError[]
}

export class ApiError extends Error {
  readonly status: number
  readonly problem: Problem | null

  constructor(status: number, problem: Problem | null) {
    super(`HTTP ${status}`)
    this.status = status
    this.problem = problem
  }

  /** Field name → error code, from the `errors` extension of a 400/409 response. */
  fieldErrors(): Record<string, string> {
    return Object.fromEntries((this.problem?.errors ?? []).map((e) => [e.field, e.code]))
  }
}

export function fieldErrorsOf(error: unknown): Record<string, string> {
  return error instanceof ApiError ? error.fieldErrors() : {}
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  json?: unknown
  form?: Record<string, string>
}

function readCookie(name: string): string | null {
  const prefix = `${name}=`
  const cookie = document.cookie.split('; ').find((c) => c.startsWith(prefix))
  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : null
}

/** Spring clears XSRF-TOKEN on login and logout; any response sets a new one, so ask for it if missing. */
async function csrfToken(): Promise<string | null> {
  if (!readCookie('XSRF-TOKEN')) {
    await fetch('/api/auth/me', { credentials: 'same-origin' })
  }
  return readCookie('XSRF-TOKEN')
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method ?? 'GET'
  const headers: Record<string, string> = { Accept: 'application/json' }
  let body: BodyInit | undefined
  if (options.json !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(options.json)
  } else if (options.form) {
    body = new URLSearchParams(options.form)
  }
  if (method !== 'GET') {
    const token = await csrfToken()
    if (token) headers['X-XSRF-TOKEN'] = token
  }

  const response = await fetch(path, { method, headers, body, credentials: 'same-origin' })
  if (!response.ok) {
    const isJson = response.headers.get('content-type')?.includes('json') ?? false
    const problem = isJson ? ((await response.json().catch(() => null)) as Problem | null) : null
    throw new ApiError(response.status, problem)
  }
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}
