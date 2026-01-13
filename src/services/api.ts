/**
 * API Service Layer
 */

import type { Song, Schedule, SongSummary, DisplaySettings, ConfidenceMonitorSettings, LayoutSettings, PartColorSettings } from '../types'

// ... (existing code, relying on smart replacement to keep lines I don't touch) ...

/**
 * Settings interface for server persistence
 */
export interface ServerSettings {
  theme?: 'light' | 'dark'
  displaySettings?: DisplaySettings
  confidenceMonitorSettings?: ConfidenceMonitorSettings
  layoutSettings?: LayoutSettings
  currentSchedule?: string
  logoMedia?: string
  backgroundVideo?: string
  previewBackground?: string
  partColors?: PartColorSettings
}

// Configuration
const API_CONFIG = {
  USE_MOCK_DATA: false, // Force false now
  LOCAL_API_URL: '/api'
}

function getApiBaseUrl(): string {
  return API_CONFIG.LOCAL_API_URL
}

/**
 * Fetch all songs (metadata only or simplified)
 */
export async function fetchSongs(): Promise<SongSummary[]> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/songs`)
    if (!response.ok) throw new Error('Failed to fetch songs')
    return await response.json()
  } catch (error) {
    console.error('API Error - fetchSongs:', error)
    return []
  }
}

/**
 * Fetch a specific song by ID
 */
export async function fetchSongById(id: number): Promise<Song | null> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/songs/${id}`)
    if (!response.ok) throw new Error('Failed to fetch song')
    return await response.json()
  } catch (error) {
    console.error('API Error - fetchSongById:', error)
    return null
  }
}

/**
 * Save or Update a song
 */
export async function saveSong(song: Song): Promise<{ success: boolean; id: number }> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/songs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(song)
    })
    if (!response.ok) throw new Error('Failed to save song')
    return await response.json()
  } catch (error) {
    console.error('API Error - saveSong:', error)
    throw error
  }
}

/**
 * Delete a song
 */
export async function deleteSong(id: number): Promise<void> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/songs/${id}`, {
      method: 'DELETE'
    })
    if (!response.ok) throw new Error('Failed to delete song')
  } catch (error) {
    console.error('API Error - deleteSong:', error)
    throw error
  }
}

/**
 * Fetch current schedule
 */
export async function fetchSchedule(): Promise<Schedule> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/schedule`)
    if (!response.ok) throw new Error('Failed to fetch schedule')
    return await response.json()
  } catch (error) {
    console.error('API Error - fetchSchedule:', error)
    return { date: new Date().toISOString(), items: [] }
  }
}

/**
 * Fetch list of all available schedules
 */
export async function fetchScheduleList(): Promise<{ name: string; filename: string; date: string | null; itemCount: number }[]> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/schedules`)
    if (!response.ok) throw new Error('Failed to fetch schedules')
    return await response.json()
  } catch (error) {
    console.error('API Error - fetchScheduleList:', error)
    return []
  }
}

/**
 * Fetch a specific schedule by name
 */
export async function fetchScheduleByName(name: string): Promise<Schedule | null> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/schedule/${encodeURIComponent(name)}`)
    if (!response.ok) throw new Error('Failed to fetch schedule')
    return await response.json()
  } catch (error) {
    console.error('API Error - fetchScheduleByName:', error)
    return null
  }
}

/**
 * Save schedule
 */
export async function saveSchedule(schedule: Schedule, name?: string): Promise<void> {
  try {
    const url = name ? `${getApiBaseUrl()}/schedule/${encodeURIComponent(name)}` : `${getApiBaseUrl()}/schedule`
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(schedule)
    })
    if (!response.ok) throw new Error('Failed to save schedule')
  } catch (error) {
    console.error('API Error - saveSchedule:', error)
    throw error
  }
}

/**
 * Create a new schedule
 */
export async function createSchedule(name: string): Promise<{ success: boolean; name: string } | null> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/schedules/new`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    })
    if (!response.ok) throw new Error('Failed to create schedule')
    return await response.json()
  } catch (error) {
    console.error('API Error - createSchedule:', error)
    return null
  }
}

/**
 * Fetch available video assets
 */
export async function fetchVideoAssets(): Promise<{ name: string; path: string; thumbnail?: string }[]> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/videos`)
    if (!response.ok) throw new Error('Failed to fetch videos')
    return await response.json()
  } catch (error) {
    console.error('API Error - fetchVideoAssets:', error)
    return [{ name: 'background.mp4', path: '/media/background.mp4' }]
  }
}

/**
 * Get app configuration
 */
export async function fetchConfig(): Promise<{ appTitle: string; screens: string[] }> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/config`)
    if (!response.ok) throw new Error('Failed to fetch config')
    return await response.json()
  } catch (error) {
    console.error('API Error - fetchConfig:', error)
    return {
      appTitle: 'MAGI Church Projection System',
      screens: ['control-panel', 'main-projection', 'confidence-monitor']
    }
  }
}


/**
 * Fetch settings from server
 */
export async function fetchSettings(): Promise<ServerSettings> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/settings`)
    if (!response.ok) throw new Error('Failed to fetch settings')
    return await response.json()
  } catch (error) {
    console.error('API Error - fetchSettings:', error)
    return {}
  }
}

/**
 * Save settings to server
 */
export async function saveSettings(settings: Partial<ServerSettings>): Promise<void> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    })
    if (!response.ok) throw new Error('Failed to save settings')
  } catch (error) {
    console.error('API Error - saveSettings:', error)
    throw error
  }
}

/* DEPRECATED - Compatibility Shims if needed */
export async function fetchLyrics(): Promise<any> {
  console.warn('fetchLyrics is deprecated')
  return { sets: [] }
}
