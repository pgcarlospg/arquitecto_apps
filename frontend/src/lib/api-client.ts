/**
 * Type-safe API client for GIRA Dashboard
 * Base URL is /api (proxied to backend in dev, or VITE_API_BASE_URL in production)
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data: any
  ) {
    super(`API Error ${status}: ${statusText}`)
    this.name = 'ApiError'
  }
}

async function fetchApi<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${path}`
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new ApiError(response.status, response.statusText, errorData)
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T
  }

  return response.json()
}

export const api = {
  // Health check
  health: {
    check: () => fetchApi<{ status: string; timestamp: string; version: string }>('/v1/health'),
  },

  // Users
  users: {
    list: (params?: { page?: number; pageSize?: number }) => {
      const query = new URLSearchParams()
      if (params?.page) query.set('page', String(params.page))
      if (params?.pageSize) query.set('pageSize', String(params.pageSize))
      const queryString = query.toString()
      return fetchApi<{
        data: any[]
        pagination: { page: number; pageSize: number; total: number; totalPages: number }
      }>(`/v1/users${queryString ? `?${queryString}` : ''}`)
    },
    get: (id: string) => fetchApi<any>(`/v1/users/${id}`),
    create: (data: any) => fetchApi<any>('/v1/users', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => fetchApi<any>(`/v1/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => fetchApi<void>(`/v1/users/${id}`, { method: 'DELETE' }),
  },

  // Accounts
  accounts: {
    list: (params?: { page?: number; pageSize?: number }) => {
      const query = new URLSearchParams()
      if (params?.page) query.set('page', String(params.page))
      if (params?.pageSize) query.set('pageSize', String(params.pageSize))
      const queryString = query.toString()
      return fetchApi<{
        data: any[]
        pagination: { page: number; pageSize: number; total: number; totalPages: number }
      }>(`/v1/accounts${queryString ? `?${queryString}` : ''}`)
    },
    get: (id: string) => fetchApi<any>(`/v1/accounts/${id}`),
    create: (data: any) => fetchApi<any>('/v1/accounts', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => fetchApi<any>(`/v1/accounts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => fetchApi<void>(`/v1/accounts/${id}`, { method: 'DELETE' }),
  },

  // Generic entity operations (for any entity defined in OpenAPI)
  entity: {
    list: <T = any>(entity: string, params?: { page?: number; pageSize?: number }) => {
      const query = new URLSearchParams()
      if (params?.page) query.set('page', String(params.page))
      if (params?.pageSize) query.set('pageSize', String(params.pageSize))
      const queryString = query.toString()
      return fetchApi<{
        data: T[]
        pagination: { page: number; pageSize: number; total: number; totalPages: number }
      }>(`/v1/${entity}${queryString ? `?${queryString}` : ''}`)
    },
    get: <T = any>(entity: string, id: string) => fetchApi<T>(`/v1/${entity}/${id}`),
    create: <T = any>(entity: string, data: any) => 
      fetchApi<T>(`/v1/${entity}`, { method: 'POST', body: JSON.stringify(data) }),
    update: <T = any>(entity: string, id: string, data: any) => 
      fetchApi<T>(`/v1/${entity}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (entity: string, id: string) => 
      fetchApi<void>(`/v1/${entity}/${id}`, { method: 'DELETE' }),
  },
}

export default api
