import { store } from '../state/store'

/**
 * KeyboardService
 * Manages global keyboard shortcuts for the Control Panel.
 */
export class KeyboardService {
    constructor() {
        this.init()
    }

    init() {
        window.addEventListener('keydown', (e) => this.handleKeyDown(e))
        console.log('[KeyboardService] Initialized')
    }

    handleKeyDown(e: KeyboardEvent) {
        // Ignore if typing in an input or textarea
        const target = e.target as HTMLElement
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
            return
        }

        // Space: Next Slide
        if (e.key === ' ' || e.code === 'Space') {
            e.preventDefault()
            if (e.shiftKey) {
                this.prevSlide()
            } else {
                this.nextSlide()
            }
            return
        }

        // Arrow Keys Navigation
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault()
            this.nextSlide()
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault()
            this.prevSlide()
        }

        // F-Key Output Controls (per spec)
        if (e.key === 'F1') {
            e.preventDefault()
            store.clearOverlays() // Clear Overlays
        } else if (e.key === 'F2') {
            e.preventDefault()
            store.toggleBlack() // Black
        } else if (e.key === 'F3') {
            e.preventDefault()
            store.toggleLogo() // Logo Toggle
        } else if (e.key === 'F4') {
            e.preventDefault()
            store.restore() // Play/Restore
        }

        // Escape: Panic Clear
        if (e.key === 'Escape') {
            e.preventDefault()
            store.clearOverlays()
        }
    }

    nextSlide() {
        const state = store.state.live
        if (!state.item_id) return

        // We need to know the max slides to prevent over-indexing provided by the Iem
        // Ideally the store shouldn't allow invalid indices, but we can check.
        // For now, trusting loose boundaries or checking against cached library item
        const current = state.slide_index || 0
        store.setLiveSlide(current + 1)
    }

    prevSlide() {
        const state = store.state.live
        if (!state.item_id) return

        const current = state.slide_index || 0
        if (current > 0) {
            store.setLiveSlide(current - 1)
        }
    }

    clearContent() {
        store.setState({
            live: {
                ...store.state.live,
                item_id: null
            }
        })
    }
}
