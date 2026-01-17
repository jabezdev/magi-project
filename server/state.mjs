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
export const sharedState = {
    // Generic Item State (Pointers from Schedule)
    liveItem: null, // ScheduleItem
    previewItem: null, // ScheduleItem
    previousLiveItem: null, // ScheduleItem

    // Independent Layers
    active_background_id: null,

    // Unified Position State (Simple 0-based index)
    livePosition: 0,
    previewPosition: 0,
    previousLivePosition: 0,

    // Active Content State (Hydrated)
    liveItemId: null,
    liveItemType: null,
    liveContent: [], // The full hydrated array of ContentSlide

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
