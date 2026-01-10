/**
 * API Service Layer
 * 
 * This module provides an abstraction for fetching lyrics and assets.
 * Currently uses mock data / local API, but can be easily swapped
 * to use an external API service in the future.
 * 
 * To switch to a real API:
 * 1. Update the API_BASE_URL environment variable
 * 2. Modify fetch calls to include authentication if needed
 */

import type { LyricsData, Song } from '../types'

// Configuration - can be overridden with environment variables
const API_CONFIG = {
  // When USE_MOCK_DATA is true, we use the local API
  // In the future, this can be switched to false to use external API
  USE_MOCK_DATA: true,
  
  // Base URL for the external API (for future use)
  EXTERNAL_API_URL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  
  // Local API endpoint (current implementation)
  LOCAL_API_URL: '/api'
}

/**
 * Get the base URL for API calls
 */
function getApiBaseUrl(): string {
  return API_CONFIG.USE_MOCK_DATA 
    ? API_CONFIG.LOCAL_API_URL 
    : API_CONFIG.EXTERNAL_API_URL
}

/**
 * Fetch lyrics data from the API
 */
export async function fetchLyrics(): Promise<LyricsData> {
  const baseUrl = getApiBaseUrl()
  
  try {
    const response = await fetch(`${baseUrl}/lyrics`)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch lyrics: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    return data as LyricsData
  } catch (error) {
    console.error('API Error - fetchLyrics:', error)
    // Return mock data as fallback
    return getMockLyricsData()
  }
}

/**
 * Fetch a specific song by ID
 */
export async function fetchSongById(songId: number): Promise<Song | null> {
  const lyricsData = await fetchLyrics()
  
  for (const set of lyricsData.sets) {
    const song = set.songs.find(s => s.id === songId)
    if (song) return song
  }
  
  return null
}

/**
 * Fetch available video assets
 * Fetches from the videos API to get all videos in the public/videos folder
 */
export async function fetchVideoAssets(): Promise<{ name: string; path: string; thumbnail?: string }[]> {
  const baseUrl = getApiBaseUrl()
  
  try {
    const response = await fetch(`${baseUrl}/videos`)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch videos: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('API Error - fetchVideoAssets:', error)
    // Return fallback
    return [
      { name: 'background.mp4', path: '/public/videos/background.mp4' }
    ]
  }
}

/**
 * Get app configuration
 */
export async function fetchConfig(): Promise<{ appTitle: string; screens: string[] }> {
  const baseUrl = getApiBaseUrl()
  
  try {
    const response = await fetch(`${baseUrl}/config`)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch config: ${response.status}`)
    }
    
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
 * Mock lyrics data for fallback/testing
 * This ensures the app works even if the API is unavailable
 */
function getMockLyricsData(): LyricsData {
  return {
    sets: [
      {
        id: 1,
        title: 'Welcome',
        songs: [
          {
            id: 1,
            title: 'Amazing Grace',
            artist: 'John Newton',
            lyrics: [
              {
                verse: 1,
                text: 'Amazing grace, how sweet the sound\nThat saved a wretch like me\nI once was lost, but now I\'m found\nWas blind, but now I see'
              },
              {
                verse: 2,
                text: '\'Twas grace that taught my heart to fear\nAnd grace my fears relieved\nHow precious did that grace appear\nThe hour I first believed'
              },
              {
                verse: 3,
                text: 'Through many dangers, toils, and snares\nI have already come\n\'Tis grace has brought me safe thus far\nAnd grace will lead me home'
              }
            ]
          },
          {
            id: 2,
            title: 'How Great Thou Art',
            artist: 'Carl Boberg',
            lyrics: [
              {
                verse: 1,
                text: 'O Lord my God, when I in awesome wonder\nConsider all the worlds Thy hands have made\nI see the stars, I hear the rolling thunder\nThy power throughout the universe displayed'
              },
              {
                verse: 2,
                text: 'When through the woods and forest glades I wander\nAnd hear the birds sing sweetly in the trees\nWhen I look down from lofty mountain grandeur\nAnd see the brook and feel the gentle breeze'
              }
            ]
          }
        ]
      },
      {
        id: 2,
        title: 'Worship',
        songs: [
          {
            id: 3,
            title: 'Holy, Holy, Holy',
            artist: 'Reginald Heber',
            lyrics: [
              {
                verse: 1,
                text: 'Holy, holy, holy! Lord God Almighty!\nEarly in the morning our song shall rise to Thee\nHoly, holy, holy, merciful and mighty\nGod in three persons, blessed Trinity'
              }
            ]
          }
        ]
      }
    ],
    defaultBackgroundVideo: '/public/videos/background.mp4',
    theme: {
      primaryColor: '#1a1a2e',
      accentColor: '#0f3460',
      textColor: '#ffffff'
    }
  }
}

export { API_CONFIG }
