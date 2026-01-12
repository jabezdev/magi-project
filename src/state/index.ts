/**
 * Application State Management
 * 
 * Uses a subscription-based approach for efficient updates.
 * Components can subscribe to specific state changes instead of full re-renders.
 */

import type { AppState, DisplaySettings, ConfidenceMonitorSettings, LayoutSettings, Song } from '../types'
import { DEFAULT_DISPLAY_SETTINGS, DEFAULT_CONFIDENCE_MONITOR_SETTINGS, DEFAULT_LAYOUT_SETTINGS, DEFAULT_POSITION, DEFAULT_BACKGROUND_VIDEO, DEFAULT_LOGO_MEDIA, STORAGE_KEYS } from '../constants/defaults'
import { socketService } from '../services/socket'
import { saveSettings as saveSettingsToServer, fetchSettings } from '../services/api'

// Load saved settings from localStorage (fallback)
function loadSavedTheme(): 'light' | 'dark' {
  return (localStorage.getItem(STORAGE_KEYS.THEME) as 'light' | 'dark') || 'dark'
}

function loadSavedDisplaySettings(): DisplaySettings {
  const saved = localStorage.getItem(STORAGE_KEYS.DISPLAY_SETTINGS)
  if (saved) {
    try {
      return { ...DEFAULT_DISPLAY_SETTINGS, ...JSON.parse(saved) }
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
      return { ...DEFAULT_CONFIDENCE_MONITOR_SETTINGS, ...JSON.parse(saved) }
    } catch {
      return DEFAULT_CONFIDENCE_MONITOR_SETTINGS
    }
  }
  return DEFAULT_CONFIDENCE_MONITOR_SETTINGS
}

function loadSavedLayoutSettings(): LayoutSettings {
  const saved = localStorage.getItem(STORAGE_KEYS.LAYOUT_SETTINGS)
  if (saved) {
    try {
      return { ...DEFAULT_LAYOUT_SETTINGS, ...JSON.parse(saved) }
    } catch {
      return DEFAULT_LAYOUT_SETTINGS
    }
  }
  return DEFAULT_LAYOUT_SETTINGS
}

function loadSavedCurrentSchedule(): string {
  return localStorage.getItem(STORAGE_KEYS.CURRENT_SCHEDULE) || 'current'
}

// Load saved preview background
function loadSavedPreviewBackground(): string {
  return localStorage.getItem(STORAGE_KEYS.PREVIEW_BACKGROUND) || DEFAULT_BACKGROUND_VIDEO
}

// Application state singleton
export const state: AppState = {
  previewSong: null,
  previewVariation: 0,
  previewPosition: { ...DEFAULT_POSITION },
  liveSong: null,
  liveVariation: 0,
  livePosition: { ...DEFAULT_POSITION },
  previousLiveSong: null,
  previousLiveVariation: 0,
  previousLivePosition: { ...DEFAULT_POSITION },
  backgroundVideo: DEFAULT_BACKGROUND_VIDEO,
  previewBackground: loadSavedPreviewBackground(),
  availableVideos: [],
  logoMedia: DEFAULT_LOGO_MEDIA,
  displayMode: 'logo',

  songs: [],
  schedule: { date: new Date().toISOString(), items: [] },
  lyricsData: null,

  theme: loadSavedTheme(),
  displaySettings: loadSavedDisplaySettings(),
  confidenceMonitorSettings: loadSavedConfidenceMonitorSettings(),
  layoutSettings: loadSavedLayoutSettings()
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
  const liveKeys: Array<keyof AppState> = ['liveSong', 'liveVariation', 'livePosition', 'previousLiveSong', 'previousLiveVariation', 'previousLivePosition']
  const displayKeys: Array<keyof AppState> = ['displayMode', 'displaySettings', 'backgroundVideo', 'previewBackground', 'logoMedia']
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
  const effectiveUpdates: Partial<AppState> = {}
  const changedKeys: Array<keyof AppState> = []

  // Filter out unchanged values to prevent unnecessary triggers
  for (const [key, value] of Object.entries(newState)) {
    const k = key as keyof AppState
    const currentValue = state[k]

    // Custom equality checks
    let hasChanged = false

    // Check for Songs (compare by ID)
    if ((k === 'liveSong' || k === 'previewSong') && value && currentValue) {
      const newSong = value as Song
      const oldSong = currentValue as Song
      if (newSong.id !== oldSong.id) {
        hasChanged = true
      }
    }
    // Check for Layout settings (deep compare simplified)
    else if (k === 'layoutSettings' && value && currentValue) {
      if (JSON.stringify(value) !== JSON.stringify(currentValue)) {
        hasChanged = true
      }
    }
    // Strict equality for primitives and references
    else if (value !== currentValue) {
      hasChanged = true
    }

    if (hasChanged) {
      effectiveUpdates[k] = value as any
      changedKeys.push(k)
    }
  }

  if (changedKeys.length === 0) return

  // Apply state changes
  Object.assign(state, effectiveUpdates)

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
 * Save theme to localStorage and server
 */
export function saveTheme(theme: 'light' | 'dark'): void {
  state.theme = theme
  localStorage.setItem(STORAGE_KEYS.THEME, theme)
  document.body.setAttribute('data-theme', theme)
  // Save to server (fire and forget)
  saveSettingsToServer({ theme }).catch(console.error)
}

/**
 * Save display settings to localStorage and server (Main Screen)
 */
export function saveDisplaySettings(settings: DisplaySettings): void {
  state.displaySettings = settings
  localStorage.setItem(STORAGE_KEYS.DISPLAY_SETTINGS, JSON.stringify(settings))
  socketService.updateDisplaySettings(settings)
  // Save to server (fire and forget)
  saveSettingsToServer({ displaySettings: settings }).catch(console.error)
}

/**
 * Save confidence monitor settings to localStorage and server
 */
export function saveConfidenceMonitorSettings(settings: ConfidenceMonitorSettings): void {
  state.confidenceMonitorSettings = settings
  localStorage.setItem(STORAGE_KEYS.CONFIDENCE_MONITOR_SETTINGS, JSON.stringify(settings))
  socketService.updateConfidenceMonitorSettings(settings)
  // Save to server (fire and forget)
  saveSettingsToServer({ confidenceMonitorSettings: settings }).catch(console.error)
}

/**
 * Save layout settings to localStorage and server
 */
export function saveLayoutSettings(settings: LayoutSettings): void {
  state.layoutSettings = settings
  localStorage.setItem(STORAGE_KEYS.LAYOUT_SETTINGS, JSON.stringify(settings))
  // Save to server (fire and forget)
  saveSettingsToServer({ layoutSettings: settings }).catch(console.error)
}

/**
 * Save current schedule name
 */
export function saveCurrentScheduleName(name: string): void {
  localStorage.setItem(STORAGE_KEYS.CURRENT_SCHEDULE, name)
  // Save to server (fire and forget)
  saveSettingsToServer({ currentSchedule: name }).catch(console.error)
}

/**
 * Get the saved current schedule name
 */
export function getSavedCurrentSchedule(): string {
  return loadSavedCurrentSchedule()
}

/**
 * Load settings from server and merge with local
 */
export async function loadSettingsFromServer(): Promise<void> {
  try {
    const serverSettings = await fetchSettings()

    const updates: Partial<AppState> = {}

    if (serverSettings.theme) {
      updates.theme = serverSettings.theme
      localStorage.setItem(STORAGE_KEYS.THEME, serverSettings.theme)
      document.body.setAttribute('data-theme', serverSettings.theme)
    }

    if (serverSettings.displaySettings) {
      const merged = { ...DEFAULT_DISPLAY_SETTINGS, ...serverSettings.displaySettings } as DisplaySettings
      updates.displaySettings = merged
      localStorage.setItem(STORAGE_KEYS.DISPLAY_SETTINGS, JSON.stringify(merged))
    }

    if (serverSettings.confidenceMonitorSettings) {
      const merged = { ...DEFAULT_CONFIDENCE_MONITOR_SETTINGS, ...serverSettings.confidenceMonitorSettings } as ConfidenceMonitorSettings
      updates.confidenceMonitorSettings = merged
      localStorage.setItem(STORAGE_KEYS.CONFIDENCE_MONITOR_SETTINGS, JSON.stringify(merged))
    }

    if (serverSettings.layoutSettings) {
      const merged = { ...DEFAULT_LAYOUT_SETTINGS, ...serverSettings.layoutSettings } as LayoutSettings
      updates.layoutSettings = merged
      localStorage.setItem(STORAGE_KEYS.LAYOUT_SETTINGS, JSON.stringify(merged))
    }

    if (serverSettings.currentSchedule) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_SCHEDULE, serverSettings.currentSchedule)
    }

    if (serverSettings.logoMedia) {
      updates.logoMedia = serverSettings.logoMedia
    }

    if (serverSettings.backgroundVideo) {
      updates.backgroundVideo = serverSettings.backgroundVideo
    }

    if (serverSettings.previewBackground) {
      updates.previewBackground = serverSettings.previewBackground
      localStorage.setItem(STORAGE_KEYS.PREVIEW_BACKGROUND, serverSettings.previewBackground)
    }

    // Apply all updates and notify subscribers
    if (Object.keys(updates).length > 0) {
      updateState(updates)
    }
  } catch (error) {
    console.error('Failed to load settings from server:', error)
  }
}

// Setup socket listener for state updates
socketService.onStateUpdate((newState) => {
  updateState(newState, true) // Skip full re-render for socket updates too
})
