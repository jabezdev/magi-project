import fs from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Default settings
const DEFAULT_DISPLAY_SETTINGS = {
    fontSize: 3.5,
    fontFamily: 'system-ui',
    lineHeight: 1.5,
    textColor: '#ffffff',
    allCaps: false,
    textShadow: true,
    shadowBlur: 4,
    shadowOffsetX: 2,
    shadowOffsetY: 2,
    textOutline: false,
    outlineWidth: 2,
    outlineColor: '#000000',
    marginTop: 10,
    marginBottom: 10,
    marginLeft: 5,
    marginRight: 5
}

const DEFAULT_CONFIDENCE_MONITOR_SETTINGS = {
    fontSize: 2.5,
    fontFamily: 'system-ui',
    lineHeight: 1.4,
    prevNextOpacity: 0.35,
    clockSize: 1.25,
    marginTop: 0.5,
    marginBottom: 0.5,
    marginLeft: 0.5,
    marginRight: 0.5
}

// Load settings from file
function loadSettingsFromFile() {
    try {
        const settingsPath = join(__dirname, '..', 'data', 'settings.json')
        if (fs.existsSync(settingsPath)) {
            const data = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
            return data
        }
    } catch (error) {
        console.error('Failed to load settings from file:', error)
    }
    return {}
}

// Get saved settings
const savedSettings = loadSettingsFromFile()

// ============ SHARED STATE ============
// This state is synchronized across all connected clients
export const sharedState = {
    liveSong: null,
    liveVariation: 0,
    livePosition: { partIndex: 0, slideIndex: 0 },
    backgroundVideo: savedSettings.backgroundVideo || '/public/videos/background.mp4',
    logoMedia: savedSettings.logoMedia || '/public/videos/logo.mp4',
    displayMode: 'clear', // 'lyrics' | 'logo' | 'black' | 'clear'
    displaySettings: { ...DEFAULT_DISPLAY_SETTINGS, ...savedSettings.displaySettings },
    confidenceMonitorSettings: { ...DEFAULT_CONFIDENCE_MONITOR_SETTINGS, ...savedSettings.confidenceMonitorSettings },
    availableVideos: []
}

// Track connected clients
export const connectedClients = new Map()

export function updateAvailableVideos(videoDir) {
    try {
        if (!fs.existsSync(videoDir)) return

        const files = fs.readdirSync(videoDir)
        const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv']

        const videos = files
            .filter(file => videoExtensions.some(ext => file.toLowerCase().endsWith(ext)))
            .map(file => {
                const videoPath = `/media/${file}`
                const thumbFileName = `${file}.jpg`
                const thumbFilePath = join(videoDir, 'thumbnails', thumbFileName)
                const thumbUrl = `/media/thumbnails/${thumbFileName}`

                let thumbnail = videoPath // Default to video itself

                // Check if generated thumbnail exists
                if (fs.existsSync(thumbFilePath)) {
                    thumbnail = thumbUrl
                } else {
                    // Check for manual sidecars
                    const extensions = ['.jpg', '.jpeg', '.png', '.webp']
                    const basePath = join(videoDir, file)
                    for (const ext of extensions) {
                        if (fs.existsSync(basePath + ext)) {
                            thumbnail = `/media/${file}${ext}` // manual override
                            break
                        }
                    }
                }

                return {
                    name: file,
                    path: videoPath,
                    thumbnail: thumbnail
                }
            })

        sharedState.availableVideos = videos
    } catch (e) {
        console.error('[STATE] Failed to update available videos:', e)
    }
}

