import fs from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

import { DEFAULT_DISPLAY_SETTINGS, DEFAULT_CONFIDENCE_MONITOR_SETTINGS, loadSettingsFromFile } from './config.mjs'

// Get saved settings
const savedSettings = loadSettingsFromFile()

// ============ SHARED STATE ============
// This state is synchronized across all connected clients
// ============ SHARED STATE ============
// This state is synchronized across all connected clients
export const sharedState = {
    // Generic Item State
    liveItem: null, // ScheduleItem
    previewItem: null, // ScheduleItem
    previousLiveItem: null, // ScheduleItem

    // Song Specific State (Hydrated if item is song)
    liveSong: null,
    liveVariation: 0,
    livePosition: { partIndex: 0, slideIndex: 0 },

    previousLiveSong: null,
    previousLiveVariation: 0,
    previousLivePosition: { partIndex: 0, slideIndex: 0 },

    previewSong: null,
    previewVariation: 0,
    previewPosition: { partIndex: 0, slideIndex: 0 },

    // Media Playback State
    liveMediaState: {
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        isCanvaHolding: false
    },

    backgroundVideo: savedSettings.backgroundVideo || '/public/videos/background.mp4',
    logoMedia: savedSettings.logoMedia || '/public/videos/logo.mp4',
    displayMode: 'clear', // 'lyrics' | 'logo' | 'black' | 'clear' | 'media'
    displaySettings: { ...DEFAULT_DISPLAY_SETTINGS, ...savedSettings.displaySettings },
    confidenceMonitorSettings: { ...DEFAULT_CONFIDENCE_MONITOR_SETTINGS, ...savedSettings.confidenceMonitorSettings },
    availableVideos: [], // Legacy compat
    availableMedia: {
        backgroundVideos: [],
        contentVideos: [],
        backgroundImages: [],
        contentImages: []
    },
    availableSlides: [],
    availableScriptures: []
}

// Track connected clients
export const connectedClients = new Map()

export function updateAvailableVideos(videoDir) {
    // Deprecated in favor of Scanners, but kept for legacy compat if needed
    // The new Scanners will update the new state fields
}



