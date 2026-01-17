import { AppState, GlobalSettings, LibraryItem, UUID } from '../types'
import { api } from '../services/api'

// Initial State
const INITIAL_STATE: AppState = {
    active_schedule_id: null,
    preview: {
        item_id: null,
        slide_index: 0,
        media_position: 0,
        is_playing: false
    },
    live: {
        item_id: null,
        slide_index: 0,
        media_position: 0,
        is_playing: false
    },
    blackout_active: false,
    clear_active: false,
    logo_active: false,
    active_background_id: null
}

type Listener<T> = (state: T) => void

/**
 * StoreService
 * A simple reactive store that creates the "Nervous System" of the app.
 * It holds the runtime state (Preview/Live) and caches Library/Settings.
 */
class StoreService {
    private _state: AppState = { ...INITIAL_STATE }
    private _settings: GlobalSettings | null = null
    private _library: LibraryItem[] = []

    private listeners: Set<Listener<AppState>> = new Set()
    private settingsListeners: Set<Listener<GlobalSettings>> = new Set()
    private libraryListeners: Set<Listener<LibraryItem[]>> = new Set()

    constructor() {
        this.init()
    }

    async init() {
        try {
            this._settings = await api.settings.get()
            this.notifySettings()

            this._library = await api.library.list()
            this.notifyLibrary()

        } catch (e) {
            console.error('Failed to initialize store:', e)
        }
    }

    // ============ STATE ACCESSORS ============

    get state() { return this._state }
    get settings() { return this._settings }
    get library() { return this._library }

    // ============ SUBSCRIPTIONS ============

    subscribe(listener: Listener<AppState>) {
        this.listeners.add(listener)
        listener(this._state) // Immediate call
        return () => this.listeners.delete(listener)
    }

    subscribeSettings(listener: Listener<GlobalSettings>) {
        this.settingsListeners.add(listener)
        if (this._settings) listener(this._settings)
        return () => this.settingsListeners.delete(listener)
    }

    subscribeLibrary(listener: Listener<LibraryItem[]>) {
        this.libraryListeners.add(listener)
        this.libraryListeners.forEach(l => l(this._library))
        // listener(this._library) 
        return () => this.libraryListeners.delete(listener)
    }

    // ============ ACTIONS ============

    setState(partial: Partial<AppState>) {
        this._state = { ...this._state, ...partial }
        this.notify()
    }

    setPreviewItem(itemId: UUID) {
        this.setState({
            preview: {
                ...this._state.preview,
                item_id: itemId,
                slide_index: 0,
                media_position: 0,
                is_playing: false
            }
        })
    }


    // Removed premature brace


    setPreviewSlide(index: number) {
        this.setState({
            preview: {
                ...this._state.preview,
                slide_index: index
            }
        })
    }

    setLiveSlide(index: number) {
        this.setState({
            live: {
                ...this._state.live,
                slide_index: index
            }
        })
    }

    goLive() {
        // Copy Preview state to Live state
        this.setState({
            live: { ...this._state.preview },
            // Reset preview? Or keep it? Usually keep it.
        })
    }

    setActiveBackground(id: UUID | null) {
        this.setState({
            active_background_id: id
        })
    }

    // ============ OUTPUT CONTROLS ============

    toggleBlack() {
        this.setState({
            blackout_active: !this._state.blackout_active,
            // Black overrides logo
            logo_active: false
        })
    }

    toggleLogo() {
        this.setState({
            logo_active: !this._state.logo_active,
            // Logo overrides black
            blackout_active: false
        })
    }

    clearOverlays() {
        // Clear content but keep background
        this.setState({
            clear_active: true,
            live: {
                ...this._state.live,
                item_id: null
            }
        })
    }

    restore() {
        // Restore normal output (disable all overrides)
        this.setState({
            blackout_active: false,
            logo_active: false,
            clear_active: false
        })
    }

    async refreshLibrary() {
        this._library = await api.library.list()
        this.notifyLibrary()
    }

    /**
     * Update settings with a partial object.
     * Persists to server and notifies all subscribers.
     */
    async updateSettings(partial: Partial<GlobalSettings>) {
        try {
            this._settings = await api.settings.update(partial)
            this.notifySettings()
        } catch (e) {
            console.error('Failed to update settings:', e)
            throw e
        }
    }

    /**
     * Force refresh settings from server
     */
    async refreshSettings() {
        try {
            this._settings = await api.settings.get()
            this.notifySettings()
        } catch (e) {
            console.error('Failed to refresh settings:', e)
        }
    }


    // ============ PRIVATE NOTIFIERS ============

    private notify() {
        this.listeners.forEach(l => l(this._state))
    }

    private notifySettings() {
        if (this._settings) {
            this.settingsListeners.forEach(l => l(this._settings!))
        }
    }

    private notifyLibrary() {
        this.libraryListeners.forEach(l => l(this._library))
    }
}

export const store = new StoreService()
