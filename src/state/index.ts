/**
 * Application State Management
 * 
 * Uses a subscription-based approach for efficient updates.
 * Components can subscribe to specific state changes instead of full re-renders.
 */

import type { AppState, DisplaySettings, ConfidenceMonitorSettings, LayoutSettings, PartColorSettings } from '../types'
import { DEFAULT_DISPLAY_SETTINGS, DEFAULT_CONFIDENCE_MONITOR_SETTINGS, DEFAULT_LAYOUT_SETTINGS, DEFAULT_BACKGROUND_VIDEO, DEFAULT_LOGO_MEDIA, STORAGE_KEYS, DEFAULT_PART_COLORS } from '../constants'
import { socketService, saveSettings as saveSettingsToServer, fetchSettings } from '../services'

/**
 * LOCAL CACHE FUNCTIONS
 * localStorage is used as a temporary cache for fast initial render.
 * Server (settings.json) is the source of truth - always overrides on load.
 */

function getCachedTheme(): 'light' | 'dark' {
  return (localStorage.getItem(STORAGE_KEYS.THEME) as 'light' | 'dark') || 'dark'
}

function getCachedDisplaySettings(): DisplaySettings {
  try {
    const cached = localStorage.getItem(STORAGE_KEYS.DISPLAY_SETTINGS)
    return cached ? { ...DEFAULT_DISPLAY_SETTINGS, ...JSON.parse(cached) } : DEFAULT_DISPLAY_SETTINGS
  } catch {
    return DEFAULT_DISPLAY_SETTINGS
  }
}

function getCachedConfidenceMonitorSettings(): ConfidenceMonitorSettings {
  try {
    const cached = localStorage.getItem(STORAGE_KEYS.CONFIDENCE_MONITOR_SETTINGS)
    return cached ? { ...DEFAULT_CONFIDENCE_MONITOR_SETTINGS, ...JSON.parse(cached) } : DEFAULT_CONFIDENCE_MONITOR_SETTINGS
  } catch {
    return DEFAULT_CONFIDENCE_MONITOR_SETTINGS
  }
}

function getCachedLayoutSettings(): LayoutSettings {
  try {
    const cached = localStorage.getItem(STORAGE_KEYS.LAYOUT_SETTINGS)
    return cached ? { ...DEFAULT_LAYOUT_SETTINGS, ...JSON.parse(cached) } : DEFAULT_LAYOUT_SETTINGS
  } catch {
    return DEFAULT_LAYOUT_SETTINGS
  }
}

function getCachedPartColors(): PartColorSettings {
  try {
    const cached = localStorage.getItem(STORAGE_KEYS.PART_COLORS)
    return cached ? { ...DEFAULT_PART_COLORS, ...JSON.parse(cached) } : DEFAULT_PART_COLORS
  } catch {
    return DEFAULT_PART_COLORS
  }
}

/**
 * Update cache (called when saving or after server sync)
 */
function updateCache(key: string, value: any): void {
  try {
    localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value))
  } catch (e) {
    console.warn('Failed to update cache:', e)
  }
}

// Application state singleton
export const state: AppState = {
  // Preview state (unified)
  previewItem: null,
  previewContent: [],
  previewPosition: 0,

  // Live state (unified)
  liveItem: null,
  liveContent: [],
  livePosition: 0,
  liveMediaState: {
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    isCanvaHolding: false
  },

  // Previous state (for transitions)
  previousItem: null,
  previousContent: [],
  previousPosition: 0,

  backgroundVideo: DEFAULT_BACKGROUND_VIDEO,
  previewBackground: DEFAULT_BACKGROUND_VIDEO,
  availableVideos: [],
  logoMedia: DEFAULT_LOGO_MEDIA,
  displayMode: 'logo',

  songs: [],
  schedule: { date: new Date().toISOString(), items: [] },
  lyricsData: null,

  // Settings - use cache for fast initial render (server will override)
  theme: getCachedTheme(),
  displaySettings: getCachedDisplaySettings(),
  confidenceMonitorSettings: getCachedConfidenceMonitorSettings(),
  layoutSettings: getCachedLayoutSettings(),
  partColors: getCachedPartColors()
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

  // Include both new unified keys and legacy keys for backward compatibility
  const previewKeys: Array<keyof AppState> = ['previewItem', 'previewContent', 'previewPosition']
  const liveKeys: Array<keyof AppState> = ['liveItem', 'liveContent', 'livePosition', 'previousItem', 'previousContent', 'previousPosition']
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

    // Check for Layout settings (deep compare simplified)
    if (k === 'layoutSettings' && value && currentValue) {
      if (JSON.stringify(value) !== JSON.stringify(currentValue)) {
        hasChanged = true
      }
    }
    // Strict equality for primitives and references
    else if (value !== currentValue) {
      hasChanged = true
    }

    if (hasChanged) {
      ; (effectiveUpdates as any)[k] = value
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
 * SAVE FUNCTIONS
 * Save to state + server (source of truth) + cache (for fast reload)
 */

export function saveTheme(theme: 'light' | 'dark'): void {
  state.theme = theme
  updateCache(STORAGE_KEYS.THEME, theme)
  document.body.setAttribute('data-theme', theme)
  saveSettingsToServer({ theme }).catch(console.error)
}

export function saveDisplaySettings(settings: DisplaySettings): void {
  state.displaySettings = settings
  updateCache(STORAGE_KEYS.DISPLAY_SETTINGS, settings)
  socketService.updateDisplaySettings(settings)
  saveSettingsToServer({ displaySettings: settings }).catch(console.error)
}

export function saveConfidenceMonitorSettings(settings: ConfidenceMonitorSettings): void {
  state.confidenceMonitorSettings = settings
  updateCache(STORAGE_KEYS.CONFIDENCE_MONITOR_SETTINGS, settings)
  socketService.updateConfidenceMonitorSettings(settings)
  saveSettingsToServer({ confidenceMonitorSettings: settings }).catch(console.error)
}

export function saveLayoutSettings(settings: LayoutSettings): void {
  state.layoutSettings = settings
  updateCache(STORAGE_KEYS.LAYOUT_SETTINGS, settings)
  saveSettingsToServer({ layoutSettings: settings }).catch(console.error)
}

export function savePartColors(settings: PartColorSettings): void {
  state.partColors = settings
  updateCache(STORAGE_KEYS.PART_COLORS, settings)
  saveSettingsToServer({ partColors: settings } as any).catch(console.error)
}

const stateInternal = {
  currentScheduleName: ''
}

export function saveCurrentScheduleName(name: string): void {
  stateInternal.currentScheduleName = name
}

/**
 * Get the current schedule name (session only)
 */
export function getSavedCurrentSchedule(): string {
  return stateInternal.currentScheduleName
}

/**
 * Load settings from server (source of truth) and update cache
 */
export async function loadSettingsFromServer(): Promise<void> {
  try {
    const serverSettings = await fetchSettings()

    const updates: Partial<AppState> = {}

    if (serverSettings.theme) {
      updates.theme = serverSettings.theme
      updateCache(STORAGE_KEYS.THEME, serverSettings.theme)
      document.body.setAttribute('data-theme', serverSettings.theme)
    }

    if (serverSettings.displaySettings) {
      const merged = { ...DEFAULT_DISPLAY_SETTINGS, ...serverSettings.displaySettings } as DisplaySettings
      updates.displaySettings = merged
      updateCache(STORAGE_KEYS.DISPLAY_SETTINGS, merged)
    }

    if (serverSettings.confidenceMonitorSettings) {
      const merged = { ...DEFAULT_CONFIDENCE_MONITOR_SETTINGS, ...serverSettings.confidenceMonitorSettings } as ConfidenceMonitorSettings
      updates.confidenceMonitorSettings = merged
      updateCache(STORAGE_KEYS.CONFIDENCE_MONITOR_SETTINGS, merged)
    }

    if (serverSettings.layoutSettings) {
      const merged = { ...DEFAULT_LAYOUT_SETTINGS, ...serverSettings.layoutSettings } as LayoutSettings
      updates.layoutSettings = merged
      updateCache(STORAGE_KEYS.LAYOUT_SETTINGS, merged)
    }

    if (serverSettings.partColors) {
      const merged = { ...DEFAULT_PART_COLORS, ...serverSettings.partColors }
      updates.partColors = merged
      updateCache(STORAGE_KEYS.PART_COLORS, merged)
    }

    if (serverSettings.logoMedia) {
      updates.logoMedia = serverSettings.logoMedia
    }

    if (serverSettings.backgroundVideo) {
      updates.backgroundVideo = serverSettings.backgroundVideo
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
