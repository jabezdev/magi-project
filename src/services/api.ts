import { BaseMediaItem, GlobalSettings, LibraryItem, UUID } from '../types'

const API_ROOT = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_ROOT}${endpoint}`, {
    ...options,
    headers: {
      ...(options?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...options?.headers,
    },
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error || `Request failed: ${res.statusText}`)
  }

  return res.json()
}

export const api = {
  library: {
    list: (type?: string) => request<LibraryItem[]>(`/library${type ? `?type=${type}` : ''}`),

    get: (id: UUID) => request<LibraryItem>(`/library/${id}`),

    create: (item: Partial<LibraryItem>) => request<LibraryItem>('/library', {
      method: 'POST',
      body: JSON.stringify(item),
    }),

    update: (id: UUID, updates: Partial<LibraryItem>, summary?: string) => request<LibraryItem>(`/library/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...updates, change_summary: summary }),
    }),

    delete: (id: UUID) => request<{ success: boolean }>(`/library/${id}`, {
      method: 'DELETE'
    }),

    getHistory: (id: UUID) => request<any[]>(`/library/${id}/history`), // TODO: Add HistoryEntry type to frontend

    revert: (id: UUID, commitId: UUID) => request<LibraryItem>(`/library/${id}/revert`, {
      method: 'POST',
      body: JSON.stringify({ commit_id: commitId }),
    }),
  },

  settings: {
    get: () => request<GlobalSettings>('/settings'),

    update: (updates: Partial<GlobalSettings>) => request<GlobalSettings>('/settings', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),
  },

  upload: (formData: FormData) => request<{ success: boolean, files: any[] }>('/upload', {
    method: 'POST',
    body: formData
  }),

  youtube: {
    getMeta: (url: string) => request<{ title: string, duration: number, thumbnail: string }>(`/youtube/meta?url=${encodeURIComponent(url)}`)
  }
}
