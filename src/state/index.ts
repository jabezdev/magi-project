/**
 * Application State Management
 * 
 * Uses a subscription-based approach for efficient updates.
 * Components can subscribe to specific state changes instead of full re-renders.
 */

import type { AppState, DisplaySettings, ConfidenceMonitorSettings } from '../types'
import { DEFAULT_DISPLAY_SETTINGS, DEFAULT_CONFIDENCE_MONITOR_SETTINGS, DEFAULT_POSITION, DEFAULT_BACKGROUND_VIDEO, DEFAULT_LOGO_MEDIA, STORAGE_KEYS } from '../constants/defaults'
import { socketService } from '../services/socket'

// Load saved settings from localStorage
function loadSavedTheme(): 'light' | 'dark' {
  return (localStorage.getItem(STORAGE_KEYS.THEME) as 'light' | 'dark') || 'dark'
}

function loadSavedDisplaySettings(): DisplaySettings {
  const saved = localStorage.getItem(STORAGE_KEYS.DISPLAY_SETTINGS)
  if (saved) {
    try {
      return JSON.parse(saved)
    } catch {
      return DEFAULT_DISPLAY_SETTINGS
    }
  }
  return DEFAULT_DISPLAY_SETTINGS
}

function loadSavedConfidenceMonitorSettings(): ConfidenceMonitorSettings {
  const saved = localStorage.getItem(STORAGE_KEYS.CONFIDENCE_MONITOR_SETTINGS)
  if (saved) {
    try {
      return JSON.parse(saved)
    } catch {
      return DEFAULT_CONFIDENCE_MONITOR_SETTINGS
    }
  }
  return DEFAULT_CONFIDENCE_MONITOR_SETTINGS
}

// Application state singleton
export const state: AppState = {
  previewSong: null,
  previewVariation: 0,
  previewPosition: { ...DEFAULT_POSITION },
  liveSong: null,
  liveVariation: 0,
  livePosition: { ...DEFAULT_POSITION },
  backgroundVideo: DEFAULT_BACKGROUND_VIDEO,
  availableVideos: [],
  logoMedia: DEFAULT_LOGO_MEDIA,
  displayMode: 'clear',

  songs: [],
  schedule: { date: new Date().toISOString(), items: [] },
  lyricsData: null,

  theme: loadSavedTheme(),
  displaySettings: loadSavedDisplaySettings(),
  confidenceMonitorSettings: loadSavedConfidenceMonitorSettings()
}

// Types for state change notifications
export type StateChangeKey = keyof AppState | 'preview' | 'live' | 'display' | 'all' | 'data'

type StateSubscriber = (changedKeys: StateChangeKey[]) => void

// Screen update callback (legacy - full re-render)
let updateScreenCallback: (() => void) | null = null

// Subscribers for granular updates
const subscribers = new Set<StateSubscriber>()

// Pending update (for batching)
let pendingUpdate: number | null = null
let pendingChanges: Set<StateChangeKey> = new Set()

export function setUpdateScreenCallback(callback: () => void): void {
  updateScreenCallback = callback
}

/**
 * Subscribe to state changes
 */
export function subscribeToState(callback: StateSubscriber): () => void {
  subscribers.add(callback)
  return () => subscribers.delete(callback)
}

/**
 * Determine which logical groups changed based on the updated keys
 */
function getChangedGroups(updatedKeys: Array<keyof AppState>): StateChangeKey[] {
  const groups: StateChangeKey[] = [...updatedKeys]

  const previewKeys: Array<keyof AppState> = ['previewSong', 'previewVariation', 'previewPosition']
  const liveKeys: Array<keyof AppState> = ['liveSong', 'liveVariation', 'livePosition']
  const displayKeys: Array<keyof AppState> = ['displayMode', 'displaySettings', 'backgroundVideo', 'logoMedia']
  const dataKeys: Array<keyof AppState> = ['songs', 'schedule', 'lyricsData']

  if (previewKeys.some(k => updatedKeys.includes(k))) {
    groups.push('preview')
  }
  if (liveKeys.some(k => updatedKeys.includes(k))) {
    groups.push('live')
  }
  if (displayKeys.some(k => updatedKeys.includes(k))) {
    groups.push('display')
  }
  if (dataKeys.some(k => updatedKeys.includes(k))) {
    groups.push('data')
  }

  return groups
}

/**
 * Notify subscribers of state changes (batched via requestAnimationFrame)
 */
function notifySubscribers(): void {
  if (pendingUpdate !== null) {
    return // Update already scheduled
  }

  pendingUpdate = requestAnimationFrame(() => {
    const changes = Array.from(pendingChanges)
    pendingChanges.clear()
    pendingUpdate = null

    // Notify all subscribers
    for (const subscriber of subscribers) {
      try {
        subscriber(changes)
      } catch (e) {
        console.error('State subscriber error:', e)
      }
    }
  })
}

/**
 * Update the application state and trigger screen update
 * 
 * @param newState - Partial state to merge
 * @param skipRender - If true, skip the full re-render (use for granular updates)
 */
export function updateState(newState: Partial<AppState>, skipRender = false): void {
  const changedKeys = Object.keys(newState) as Array<keyof AppState>

  // Apply state changes
  Object.assign(state, newState)

  // Track changes for batched notification
  const groups = getChangedGroups(changedKeys)
  for (const key of groups) {
    pendingChanges.add(key)
  }

  // Notify subscribers (batched)
  notifySubscribers()

  // Legacy: trigger full re-render if not skipped
  if (!skipRender && updateScreenCallback) {
    updateScreenCallback()
  }
}

/**
 * Save theme to localStorage
 */
export function saveTheme(theme: 'light' | 'dark'): void {
  state.theme = theme
  localStorage.setItem(STORAGE_KEYS.THEME, theme)
  document.body.setAttribute('data-theme', theme)
}

/**
 * Save display settings to localStorage (Main Screen)
 */
export function saveDisplaySettings(settings: DisplaySettings): void {
  state.displaySettings = settings
  localStorage.setItem(STORAGE_KEYS.DISPLAY_SETTINGS, JSON.stringify(settings))
  socketService.updateDisplaySettings(settings)
}

/**
 * Save confidence monitor settings to localStorage
 */
export function saveConfidenceMonitorSettings(settings: ConfidenceMonitorSettings): void {
  state.confidenceMonitorSettings = settings
  localStorage.setItem(STORAGE_KEYS.CONFIDENCE_MONITOR_SETTINGS, JSON.stringify(settings))
  socketService.updateConfidenceMonitorSettings(settings)
}

// Setup socket listener for state updates
socketService.onStateUpdate((newState) => {
  updateState(newState)
})
