import fs from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Default settings
export const DEFAULT_DISPLAY_SETTINGS = {
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

export const DEFAULT_CONFIDENCE_MONITOR_SETTINGS = {
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
export function loadSettingsFromFile(customDir) {
    try {
        // Allow injecting dir for flexibility, default to relative path from this file
        const baseDir = customDir || join(__dirname, '..')
        const settingsPath = join(baseDir, 'data', 'settings.json')
        if (fs.existsSync(settingsPath)) {
            const data = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
            return data
        }
    } catch (error) {
        console.error('Failed to load settings from file:', error)
    }
    return {}
}
