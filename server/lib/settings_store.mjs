import fs from 'fs'
import { join } from 'path'

const DATA_ROOT = process.env.DATA_ROOT || './data'
const SETTINGS_PATH = join(DATA_ROOT, 'settings.json')

// Safe defaults for every setting
// This ensures that even if the file is corrupted or missing keys, the app runs
const DEFAULT_SETTINGS = {
    theme: 'dark',
    outputs: {
        main: {
            enabled: true,
            fontFamily: 'system-ui',
            fontSize: 5,
            lineHeight: 1.2,
            marginTop: 0,
            marginBottom: 0,
            marginLeft: 0,
            marginRight: 0,
            textColor: '#ffffff',
            isAllCaps: false,
            hasShadow: true,
            shadowSettings: { blur: 10, x: 0, y: 4 },
            hasOutline: false,
            outlineSettings: { width: 0, color: '#000000' }
        },
        confidence: {
            enabled: true,
            fontFamily: 'monospace',
            fontSize: 3,
            lineHeight: 1.4,
            marginTop: 2,
            marginBottom: 2,
            marginLeft: 5,
            marginRight: 5,
            textColor: '#ffffff',
            isAllCaps: false,
            hasShadow: false,
            hasOutline: false
        },
        lower_thirds: {
            enabled: true,
            fontFamily: 'system-ui',
            fontSize: 2.5,
            lineHeight: 1.2,
            marginTop: 0,
            marginBottom: 5,
            marginLeft: 5,
            marginRight: 5,
            textColor: '#ffffff',
            isAllCaps: false,
            hasShadow: true,
            hasOutline: false
        },
        mobile: {
            enabled: true,
            fontFamily: 'system-ui',
            fontSize: 1.5,
            lineHeight: 1.5,
            marginTop: 10,
            marginBottom: 10,
            marginLeft: 10,
            marginRight: 10,
            textColor: '#000000',
            isAllCaps: false,
            hasShadow: false,
            hasOutline: false
        }
    },

    // Screen-specific detailed settings
    displaySettings: {
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
        marginRight: 5,
        transitions: { type: 'crossfade', duration: 0.5 }
    },

    confidenceMonitorSettings: {
        fontSize: 2.5,
        fontFamily: 'system-ui',
        lineHeight: 1.4,
        prevNextOpacity: 0.35,
        clockSize: 1.25,
        marginTop: 0.5,
        marginBottom: 0.5,
        marginLeft: 0.5,
        marginRight: 0.5,
        partGap: 2.0,
        slideGap: 0,
        transitions: { type: 'crossfade', duration: 0.5 }
    },

    lowerThirdsSettings: {
        backgroundColor: '#00FF00',
        backgroundOpacity: 1,
        fontFamily: 'Arial',
        fontSize: 48,
        fontWeight: 'bold',
        textColor: '#ffffff',
        textAlign: 'center',
        allCaps: true,
        position: 'bottom',
        marginBottom: 10,
        marginTop: 10,
        marginLeft: 5,
        marginRight: 5,
        paddingVertical: 20,
        paddingHorizontal: 40,
        visible: true,
        animationDuration: 0.5
    },

    layoutSettings: {
        songsColumnWidth: 350,
        scheduleSectionHeight: 300,
        librarySectionHeight: null,
        backgroundsSectionHeight: 200,
        thumbnailSize: 80,
        mainMonitorEnabled: true,
        confidenceMonitorEnabled: true,
        lowerThirdsMonitorEnabled: true,
        mobileMonitorEnabled: true,
        confidenceMonitorResolution: { width: 1024, height: 768 },
        mainProjectionStaticMode: false,
        monitorColumnWidth: 450
    },

    default_transitions: {
        background: { type: 'crossfade', duration: 1.0 },
        lyrics: { type: 'crossfade', duration: 0.3 }
    },

    paths: {
        media_root: join(DATA_ROOT, 'library', 'assets'),
        data_root: DATA_ROOT
    },

    // Media
    logoMedia: '',
    defaultBackgroundVideo: '',

    // Part Colors
    partColors: {
        'V': '#3b82f6',
        'CH': '#ef4444',
        'pCH': '#f97316',
        'BR': '#8b5cf6',
        'TAG': '#ec4899',
        'IN': '#10b981',
        'OUT': '#6366f1'
    }
}


export class SettingsStore {
    constructor(filePath = SETTINGS_PATH) {
        this.filePath = filePath
        this.settings = { ...DEFAULT_SETTINGS }

        // Ensure data root exists
        if (!fs.existsSync(DATA_ROOT)) {
            fs.mkdirSync(DATA_ROOT, { recursive: true })
        }

        this.load()
    }

    load() {
        if (!fs.existsSync(this.filePath)) {
            // No settings file, save defaults
            this.save()
            return
        }

        try {
            const fileContent = fs.readFileSync(this.filePath, 'utf-8')
            const parsed = JSON.parse(fileContent)

            // Deep merge defaults with loaded data to ensure new keys exist
            this.settings = this.deepMerge(this.settings, parsed)
        } catch (e) {
            console.error('Failed to load settings, using defaults', e)
        }
    }

    save() {
        try {
            fs.writeFileSync(this.filePath, JSON.stringify(this.settings, null, 2))
        } catch (e) {
            console.error('Failed to save settings', e)
        }
    }

    get() {
        return this.settings
    }

    /**
     * Update settings with a partial object.
     * Supports deep merging.
     * @param {Object} partialSettings 
     */
    update(partialSettings) {
        this.settings = this.deepMerge(this.settings, partialSettings)
        this.save()
        return this.settings
    }

    // Helper: Deep Merge
    deepMerge(target, source) {
        if (typeof target !== 'object' || typeof source !== 'object') return source

        const output = { ...target }

        for (const key in source) {
            if (source[key] instanceof Array) {
                // Arrays are overwritten, not merged
                output[key] = source[key]
            } else if (typeof source[key] === 'object' && source[key] !== null) {
                output[key] = this.deepMerge(target[key], source[key])
            } else {
                output[key] = source[key]
            }
        }

        return output
    }
}

export const settingsStore = new SettingsStore()
