import { AppState, GlobalSettings, LibraryItem, UUID } from '../types'
import { api } from '../services/api'
import { socketService } from '../services/SocketService'

// Initial State
const INITIAL_STATE: AppState = {
    active_schedule_id: null,
    preview: {
        item_id: null,
        schedule_item_id: null,
        slide_index: 0,
        media_position: 0,
        is_playing: false
    },
    live: {
        item_id: null,
        schedule_item_id: null,
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
        this.setupSocketListeners()
    }

    private setupSocketListeners() {
        // Initial State Sync
        socketService.onStateSync((data) => {
            // Merge with local state, prioritizing server truth
            this.setState({
                live: {
                    item_id: data.liveItem?.id || null,
                    slide_index: data.livePosition || 0,
                    media_position: 0,
                    is_playing: data.liveMediaState?.isPlaying || false
                },
                preview: {
                    item_id: data.previewItem?.id || null,
                    slide_index: data.previewPosition || 0,
                    media_position: 0,
                    is_playing: false
                },
                active_background_id: data.backgroundVideo?.id || this._state.active_background_id,
                // Apply display modes
                logo_active: data.displayMode === 'logo',
                blackout_active: data.displayMode === 'black',
                clear_active: data.displayMode === 'clear'
            })
        })

        // Live Update
        socketService.onSlideUpdated((data) => {
            // Only update if we are NOT the one who initiated (optimistic UI might have already set it)
            // But actually, single source of truth is safer. Let's just update.
            // If local state matches, no-op or re-render is fine.
            this.setState({
                live: {
                    ...this._state.live,
                    item_id: data.item?.id || null,
                    slide_index: data.position || 0
                }
            })
        })

        // Preview Update
        socketService.onPreviewUpdated((data) => {
            this.setState({
                preview: {
                    ...this._state.preview,
                    item_id: data.item?.id || null,
                    slide_index: data.position || 0
                }
            })
        })

        // Display Mode Update
        socketService.onDisplayModeUpdated((data) => {
            this.setState({
                logo_active: data.mode === 'logo',
                blackout_active: data.mode === 'black',
                clear_active: data.mode === 'clear'
            })
        })
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
    get schedule(): import('../types').ScheduleItem[] {
        if (!this._state.active_schedule_id) return []
        const sched = this._library.find(i => i.id === this._state.active_schedule_id) as import('../types').Schedule | undefined
        return sched?.items || []
    }

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

    setPreviewItem(itemId: UUID, scheduleItemId?: UUID) {
        const item = this._library.find(i => i.id === itemId)
        this.setState({
            preview: {
                ...this._state.preview,
                item_id: itemId,
                schedule_item_id: scheduleItemId || null,
                slide_index: 0,
                media_position: 0,
                is_playing: false
            }
        })
        socketService.emitPreviewUpdate(item || null, [], 0)
    }


    // Removed premature brace


    setPreviewSlide(index: number) {
        this.setState({
            preview: {
                ...this._state.preview,
                slide_index: index
            }
        })
        const item = this._library.find(i => i.id === this._state.preview.item_id)
        socketService.emitPreviewUpdate(item || null, [], index)
    }

    setLiveSlide(index: number) {
        this.setState({
            live: {
                ...this._state.live,
                slide_index: index
            }
        })
        // Emit Live Update
        const item = this._library.find(i => i.id === this._state.live.item_id)
        socketService.emitSlideUpdate(item || null, [], index)
    }

    goLive() {
        // Copy Preview state to Live state
        const newItemId = this._state.preview.item_id
        const newIndex = this._state.preview.slide_index

        this.setState({
            live: { ...this._state.preview },
        })

        // Emit Live Update
        const item = this._library.find(i => i.id === newItemId)
        socketService.emitSlideUpdate(item || null, [], newIndex)
    }

    setActiveBackground(id: UUID | null) {
        // Find item in library (Backgrounds are just LibraryItems)
        const item = this._library.find(i => i.id === id)

        this.setState({
            active_background_id: id
        })

        if (item) {
            socketService.emitVideoUpdate(item)
        }
    }

    // ============ OUTPUT CONTROLS ============

    toggleBlack() {
        const newState = !this._state.blackout_active
        this.setState({
            blackout_active: newState,
            // Black overrides logo
            logo_active: false
        })
        socketService.emitDisplayMode(newState ? 'black' : 'normal')
    }

    toggleLogo() {
        const newState = !this._state.logo_active
        this.setState({
            logo_active: newState,
            // Logo overrides black
            blackout_active: false
        })
        socketService.emitDisplayMode(newState ? 'logo' : 'normal')
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
        socketService.emitDisplayMode('clear')
    }

    restore() {
        // Restore normal output (disable all overrides)
        this.setState({
            blackout_active: false,
            logo_active: false,
            clear_active: false
        })
        socketService.emitDisplayMode('normal')
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
