const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1'
const ACCESS_TOKEN_KEY = 'accessToken'
const REFRESH_TOKEN_KEY = 'refreshToken'
const AUTH_USER_KEY = 'authUser'

let isRefreshing = false
let refreshSubscribers: Array<(token: string | null) => void> = []

function onRefreshed(token: string | null) {
  refreshSubscribers.forEach((callback) => callback(token))
  refreshSubscribers = []
}

function addRefreshSubscriber(callback: (token: string | null) => void) {
  refreshSubscribers.push(callback)
}

function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(ACCESS_TOKEN_KEY)
}

function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(REFRESH_TOKEN_KEY)
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return null

  try {
    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })

    if (!response.ok) return null

    const data = (await response.json()) as { access_token: string; refresh_token?: string }
    apiClient.setTokens(data.access_token, data.refresh_token)
    return data.access_token
  } catch {
    return null
  }
}

function clearAuthOnUnauthorized() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(ACCESS_TOKEN_KEY)
  window.localStorage.removeItem(REFRESH_TOKEN_KEY)
  window.localStorage.removeItem(AUTH_USER_KEY)
  window.localStorage.removeItem('userRole')
  window.localStorage.removeItem('isAdmin')
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const accessToken = getAccessToken()
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(init?.headers ?? {}),
    },
  })

  if (response.status === 401) {
    if (isRefreshing) {
      const newToken = await new Promise<string | null>((resolve) => {
        addRefreshSubscriber(resolve)
      })
      if (newToken) {
        const retryInit = {
          ...init,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${newToken}`,
            ...(init?.headers ?? {}),
          },
        }
        return request<T>(path, retryInit)
      }
      clearAuthOnUnauthorized()
      throw new Error('Authentication failed: Token refresh expired')
    }

    isRefreshing = true
    const newToken = await refreshAccessToken()
    isRefreshing = false
    onRefreshed(newToken)

    if (newToken) {
      const retryInit = {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${newToken}`,
          ...(init?.headers ?? {}),
        },
      }
      return request<T>(path, retryInit)
    }

    clearAuthOnUnauthorized()
    throw new Error('Authentication failed: Could not refresh token')
  }

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '')
    throw new Error(`API request failed: ${response.status} ${response.statusText} ${errorBody}`)
  }

  return response.json() as Promise<T>
}

async function uploadFile<T>(path: string, file: File): Promise<T> {
  const accessToken = getAccessToken()
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: formData,
  })

  if (response.status === 401) {
    clearAuthOnUnauthorized()
    throw new Error('Authentication failed: Upload unauthorized')
  }

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`)
  }

  return response.json() as Promise<T>
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  setTokens: (accessToken: string, refreshToken?: string) => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
    if (refreshToken) {
      window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
    }
  },
  clearTokens: () => {
    if (typeof window === 'undefined') return
    window.localStorage.removeItem(ACCESS_TOKEN_KEY)
    window.localStorage.removeItem(REFRESH_TOKEN_KEY)
    window.localStorage.removeItem(AUTH_USER_KEY)
  },
  login: async (email: string, password: string) => {
    const tokens = await request<{
      access_token: string
      refresh_token: string
      token_type: string
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    apiClient.setTokens(tokens.access_token, tokens.refresh_token)
    const me = await request<{ id: number; email: string; full_name: string; role: string }>(
      '/auth/me'
    )
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(me))
      window.localStorage.setItem('userRole', me.role)
      window.localStorage.setItem('isAdmin', String(me.role === 'admin'))
    }
    return { tokens, me }
  },
  signup: async (name: string, email: string, password: string) => {
    return request<{
      id: number
      email: string
      full_name: string
      role: string
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ full_name: name, email, password }),
    })
  },
  getStoredUser: () => {
    if (typeof window === 'undefined') return null
    const raw = window.localStorage.getItem(AUTH_USER_KEY)
    return raw ? (JSON.parse(raw) as { role?: string }) : null
  },
  // File upload and data management methods
  uploadFile: <T>(file: File) => uploadFile<T>('/uploads/upload', file),
  getUploadedFiles: () =>
    request<
      Array<{
        id: string
        name: string
        size: number
        columns: number
        uploadDate: string
        status: string
      }>
    >('/uploads/files'),
  getFilePreview: (filename: string, limit?: number) =>
    request<{
      filename: string
      total_rows: number
      columns: string[]
      preview: Record<string, unknown>[]
    }>(`/uploads/files/${filename}/preview${limit ? `?limit=${limit}` : ''}`),
  deleteFile: (filename: string) =>
    request<{ success: boolean; message: string }>(`/uploads/files/${filename}`, {
      method: 'DELETE',
    }),
  getCombinedData: () =>
    request<{
      success: boolean
      total_rows: number
      columns: string[]
      data: Record<string, unknown>[]
      message?: string
    }>('/uploads/data'),
  uploadRfmqFile: (file: File) =>
    uploadFile<{
      status: string
      file: { id: string; name: string; column_names?: string[] }
      columns: string[]
    }>('/rfmq/upload', file),
  validateRfmqMappings: (datasetId: string, mappings: Record<string, string>) =>
    request<{ valid: boolean; missing: string[]; unknown: string[]; missing_columns: string[] }>(
      '/rfmq/mappings/validate',
      {
        method: 'POST',
        body: JSON.stringify({ dataset_id: datasetId, mappings }),
      }
    ),
  analyzeRfmq: (
    datasetId: string,
    mappings: Record<string, string>,
    range: {
      range_type: 'last_1_month' | 'last_3_months' | 'last_6_months' | 'last_1_year' | 'custom'
      start_date?: string | null
      end_date?: string | null
    }
  ) =>
    request<{
      job_id: string
      status: string
      message: string
      analysis_period: string
      customers_analyzed: number
      transactions_analyzed: number
      range_type: 'last_1_month' | 'last_3_months' | 'last_6_months' | 'last_1_year' | 'custom'
      start_date?: string | null
      end_date?: string | null
      comparison?: {
        available: boolean
        compare_label: string
        active_customers_delta_pct: number | null
        churn_reduction_pct: number | null
        current_active_customers: number
        previous_active_customers: number
      } | null
      segments: Array<{ segment: string; count: number; percentage: number; color?: string }>
      customers: Array<{
        id: number
        name: string
        recency: number
        frequency: number
        monetary: number
        quantity: number
        segment: string
      }>
    }>('/rfmq/analyze', {
      method: 'POST',
      body: JSON.stringify({ dataset_id: datasetId, mappings, ...range }),
    }),
  generateForecast: (payload: {
    forecast_type: 'monthly' | 'quarterly' | 'yearly'
    horizon: number
    model: 'xgboost' | 'random_forest'
    show_confidence_interval: boolean
  }) =>
    request<{
      forecast_type: 'monthly' | 'quarterly' | 'yearly'
      horizon: number
      model: 'xgboost' | 'random_forest'
      expected_revenue: number
      growth_rate: number
      trend: string
      series: Array<{
        period: string
        forecast: number
        lower?: number
        upper?: number
      }>
    }>('/forecast', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
}
