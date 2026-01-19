import { store } from '../state/store'
import { LibraryItem, GlobalSettings } from '../types'
import { api } from '../services/api'
import { BehaviorRegistry } from '../behaviors/registry'

export class MainProjection {
    element: HTMLElement
    private currentItem: LibraryItem | null = null
    private currentSlideIndex: number = 0


    // Background Double Buffering
    private bgLayerA: HTMLElement
    private bgLayerB: HTMLElement
    private activeBgLayer: 'A' | 'B' = 'A'
    private currentBgId: string | null = null

    constructor() {
        this.element = document.createElement('div')
        this.element.className = 'w-full h-full bg-black text-white overflow-hidden relative'

        // Layers Structure
        // Background Layers (Double buffered for cross-dissolve)
        this.element.innerHTML = `
            <div id="bg-layer-a" class="absolute inset-0 z-0 opacity-100 transition-opacity duration-1000"></div>
            <div id="bg-layer-b" class="absolute inset-0 z-0 opacity-0 transition-opacity duration-1000"></div>
            
            <div id="layer-content" class="absolute inset-0 z-10 transition-opacity duration-300"></div>
            
            <div id="layer-black" class="absolute inset-0 z-50 bg-black hidden transition-opacity duration-500"></div>
            <div id="layer-logo" class="absolute inset-0 z-50 bg-black flex items-center justify-center hidden transition-opacity duration-500">
                <div class="text-6xl text-white/20 font-bold">LOGO</div>
            </div>
        `

        this.bgLayerA = this.element.querySelector('#bg-layer-a') as HTMLElement
        this.bgLayerB = this.element.querySelector('#bg-layer-b') as HTMLElement

        // Initial Blank State
        this.renderShell()

        // Subscribe to settings changes
        store.subscribeSettings((settings) => {

            this.applySettings(settings)
        })

        // Subscribe to Store
        store.subscribe(state => {
            // Check global overrides first
            this.updateOverlays(state.blackout_active, state.logo_active)

            if (state.live.item_id !== this.currentItem?.id) {
                if (state.live.item_id) {
                    this.loadItem(state.live.item_id)
                } else {
                    this.clear()
                }
            } else {
                // Same item, check slide change
                if (state.live.slide_index !== this.currentSlideIndex) {
                    this.currentSlideIndex = state.live.slide_index
                    this.renderContent()
                }
            }

            // Background Layer Check
            if (state.active_background_id) {
                this.loadBackground(state.active_background_id)
            } else {
                this.clearBackground()
            }
        })
    }

    /**
     * Apply settings to the screen's CSS variables
     */
    private applySettings(settings: GlobalSettings) {
        const displaySettings = settings.displaySettings
        const el = this.element

        // Apply font settings as CSS variables
        el.style.setProperty('--main-font-family', displaySettings.fontFamily)
        el.style.setProperty('--main-font-size', `${displaySettings.fontSize}rem`)
        el.style.setProperty('--main-line-height', `${displaySettings.lineHeight}`)
        el.style.setProperty('--main-text-color', displaySettings.textColor)
        el.style.setProperty('--main-all-caps', displaySettings.allCaps ? 'uppercase' : 'none')

        // Shadow settings
        if (displaySettings.textShadow) {
            el.style.setProperty('--main-text-shadow',
                `${displaySettings.shadowOffsetX}px ${displaySettings.shadowOffsetY}px ${displaySettings.shadowBlur}px rgba(0,0,0,0.8)`)
        } else {
            el.style.setProperty('--main-text-shadow', 'none')
        }

        // Outline settings
        if (displaySettings.textOutline) {
            el.style.setProperty('--main-text-stroke', `${displaySettings.outlineWidth}px ${displaySettings.outlineColor}`)
        } else {
            el.style.setProperty('--main-text-stroke', 'none')
        }

        // Apply margins
        el.style.setProperty('--main-margin-top', `${displaySettings.marginTop}%`)
        el.style.setProperty('--main-margin-bottom', `${displaySettings.marginBottom}%`)
        el.style.setProperty('--main-margin-left', `${displaySettings.marginLeft}%`)
        el.style.setProperty('--main-margin-right', `${displaySettings.marginRight}%`)
    }


    updateOverlays(isBlack: boolean, isLogo: boolean) {
        const blackLayer = this.element.querySelector('#layer-black')
        const logoLayer = this.element.querySelector('#layer-logo')

        if (blackLayer) {
            // Use fade
            if (isBlack) {
                blackLayer.classList.remove('hidden')
                setTimeout(() => blackLayer.classList.remove('opacity-0'), 10)
            } else {
                blackLayer.classList.add('opacity-0')
                setTimeout(() => blackLayer.classList.add('hidden'), 500)
            }
        }

        if (logoLayer) {
            if (isLogo) {
                logoLayer.classList.remove('hidden')
                setTimeout(() => logoLayer.classList.remove('opacity-0'), 10)
            } else {
                logoLayer.classList.add('opacity-0')
                setTimeout(() => logoLayer.classList.add('hidden'), 500)
            }
        }
    }

    renderShell() {
        // Nothing needed here really beyond initial setup
    }

    async loadItem(id: string) {
        try {
            // Fetch fresh
            const item = await api.library.get(id)
            this.currentItem = item

            this.currentSlideIndex = store.state.live.slide_index
            this.renderContent()
        } catch (e) {
            console.error('Failed to load item for projection', e)
        }
    }

    async loadBackground(id: string) {
        if (this.currentBgId === id) return
        this.currentBgId = id

        try {
            const item = await api.library.get(id)
            this.crossFadeBackground(item)
        } catch (e) {
            console.error('Failed to load background', e)
        }
    }

    crossFadeBackground(item: any) {
        // Determine which layer is currently hidden/inactive (the "next" layer)
        const nextLayer = this.activeBgLayer === 'A' ? this.bgLayerB : this.bgLayerA
        const currentLayer = this.activeBgLayer === 'A' ? this.bgLayerA : this.bgLayerB

        // 1. Load content into the next layer (which is currently opacity 0)
        const content = this.createBackgroundContent(item)
        nextLayer.innerHTML = content

        // 2. Prepare Transition: Ensure nextLayer is ON TOP
        nextLayer.style.zIndex = '10'
        currentLayer.style.zIndex = '0'

        // 3. Trigger Fade IN of next layer
        // Use a slight delay to allow DOM to render new content before fading
        setTimeout(() => {
            nextLayer.style.opacity = '1'
            // Do NOT fade out current layer yet, to avoid brightness dip
        }, 50)

        // 4. Cleanup after transition duration (1000ms)
        setTimeout(() => {
            // Hide old layer now that new layer is fully opaque
            currentLayer.style.opacity = '0'
            currentLayer.innerHTML = ''

            // Swap active ref
            this.activeBgLayer = this.activeBgLayer === 'A' ? 'B' : 'A'
        }, 1200)
    }

    createBackgroundContent(item: any) {
        const scalingMode = item.scaling_mode || 'fill' // fit, fill, stretch
        let objectFit = 'object-cover'
        if (scalingMode === 'fit') objectFit = 'object-contain'
        if (scalingMode === 'stretch') objectFit = 'object-fill'

        if (item.type === 'video') {
            if (item.is_youtube) {
                let videoId = item.source_url.split('v=')[1]
                if (!videoId) videoId = item.file_hash.replace('youtube-ref-', '')
                return `
                    <iframe 
                        width="100%" 
                        height="100%" 
                        src="https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0&mute=1&loop=1&playlist=${videoId}&modestbranding=1&rel=0" 
                        title="Background" 
                        frameborder="0" 
                        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" 
                        style="pointer-events: none; opacity: 0.6; width: 100vw; height: 100vh;" 
                    ></iframe>
                  `
            } else {
                // Local video with seamless loop handling
                // Using w-full h-full and object-fit based on settings
                return `
                      <video class="w-full h-full ${objectFit} mb-blur" autoplay muted loop style="opacity: 0.6;" 
                          onended="if(this.loop){this.currentTime=0;this.play()}" 
                          onloadedmetadata="this.playbackRate=1.0">
                         <source src="${item.source_url}" type="video/mp4">
                      </video>
                  `
            }
        } else if (item.type === 'image') {
            return `<img src="${item.source_url}" class="w-full h-full ${objectFit} mb-blur" style="opacity: 0.6;">`
        }
        return ''
    }

    clearBackground() {
        if (!this.currentBgId) return
        this.currentBgId = null
        // Fade out active layer
        const currentLayer = this.activeBgLayer === 'A' ? this.bgLayerA : this.bgLayerB
        currentLayer.style.opacity = '0'
        setTimeout(() => currentLayer.innerHTML = '', 1000)
    }

    renderContent() {
        const layer = this.element.querySelector('#layer-content')
        if (!layer) return

        // Cross-Dissolve Implementation for Content
        // 1. Create a specific invalidating container if not exists
        if (!this.currentItem) {
            // Fade out everything
            Array.from(layer.children).forEach((child) => {
                (child as HTMLElement).style.opacity = '0'
                setTimeout(() => child.remove(), 300)
            })
            return
        }

        // 2. Create new content wrapper
        const newPage = document.createElement('div')
        newPage.className = 'absolute inset-0 transition-opacity duration-300 opacity-0 flex items-center justify-center'

        // Render into newPage
        // Render into newPage
        if (this.currentItem) {
            const behavior = BehaviorRegistry.get(this.currentItem.type)
            if (behavior && behavior.renderOutput) {
                behavior.renderOutput(this.currentItem, newPage, this.currentSlideIndex)
            } else {
                newPage.innerHTML = `<div class="text-4xl text-gray-800">${this.currentItem.type}</div>`
            }
        }

        layer.appendChild(newPage)

        // 3. Trigger Fade In
        // Force reflow
        void newPage.offsetWidth
        newPage.style.opacity = '1'

        // 4. Cleanup old layers
        // Remove siblings after transition
        const siblings = Array.from(layer.children).filter(c => c !== newPage)
        siblings.forEach(sibling => {
            (sibling as HTMLElement).style.opacity = '0'
            setTimeout(() => {
                if (sibling.parentElement === layer) sibling.remove()
            }, 300)
        })
    }

    clear() {
        this.currentItem = null
        const layer = this.element.querySelector('#layer-content')
        if (layer) layer.innerHTML = ''
    }
}
