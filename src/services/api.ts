/**
 * API Service Layer
 */

import type { Song, Schedule, SongSummary } from '../types'

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
 * Save schedule
 */
export async function saveSchedule(schedule: Schedule): Promise<void> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/schedule`, {
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
 * Fetch available video assets
 */
export async function fetchVideoAssets(): Promise<{ name: string; path: string; thumbnail?: string }[]> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/videos`)
    if (!response.ok) throw new Error('Failed to fetch videos')
    return await response.json()
  } catch (error) {
    console.error('API Error - fetchVideoAssets:', error)
    return [{ name: 'background.mp4', path: '/public/videos/background.mp4' }]
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

/* DEPRECATED - Compatibility Shims if needed */
export async function fetchLyrics(): Promise<any> {
  console.warn('fetchLyrics is deprecated')
  return { sets: [] }
}
