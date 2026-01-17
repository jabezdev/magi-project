import { store } from '../state/store'
import { LibraryItem, GlobalSettings } from '../types'
import { api } from '../services/api'

export class MainProjection {
    element: HTMLElement
    private currentItem: LibraryItem | null = null
    private currentSlideIndex: number = 0
    private _currentSettings: GlobalSettings | null = null

    constructor() {
        this.element = document.createElement('div')
        this.element.className = 'w-full h-full bg-black text-white overflow-hidden relative'

        // Layers
        this.element.innerHTML = `
            <div id="layer-background" class="absolute inset-0 z-0"></div>
            <div id="layer-content" class="absolute inset-0 z-10"></div>
            <div id="layer-black" class="absolute inset-0 z-50 bg-black hidden"></div>
            <div id="layer-logo" class="absolute inset-0 z-50 bg-black flex items-center justify-center hidden">
                <div class="text-6xl text-white/20 font-bold">LOGO</div>
            </div>
        `

        // Initial Blank State
        this.renderShell()

        // Subscribe to settings changes
        store.subscribeSettings((settings) => {
            this._currentSettings = settings
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
            blackLayer.classList.toggle('hidden', !isBlack)
        }
        if (logoLayer) {
            logoLayer.classList.toggle('hidden', !isLogo)
        }
    }

    renderShell() {
        this.element.innerHTML = '' // Black
    }

    async loadItem(id: string) {
        try {
            // Fetch fresh
            const item = await api.library.get(id)
            this.currentItem = item
            this.renderContent()
        } catch (e) {
            console.error('Failed to load item for projection', e)
        }
    }

    // Cache current background ID to avoid re-fetching
    private currentBgId: string | null = null

    async loadBackground(id: string) {
        if (this.currentBgId === id) return
        this.currentBgId = id

        // Transition Logic:
        // 1. Create new background layer on top of old one
        // 2. Load content
        // 3. Fade in
        // 4. Remove old layer

        // For now, simpler implementation:
        // Just replace innerHTML. To do smooth crossfade requires managing two persistent "slots" A and B.
        // Let's defer full crossfade for background to "Advanced Polish Part 2" or nice-to-have.
        // Current implementation re-renders immediately.

        try {
            const item = await api.library.get(id)
            this.renderBackground(item)
        } catch (e) {
            console.error('Failed to load background', e)
        }
    }

    // TODO: Improve this to use double-buffering for true cross-dissolve
    renderBackground(item: any) {
        const layer = this.element.querySelector('#layer-background')
        if (!layer) return

        // Simple fade out/in simulation
        const content = this.createBackgroundContent(item)
        layer.innerHTML = content
    }

    createBackgroundContent(item: any) {
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
                return `
                      <video id="bg-video" class="w-full h-full object-cover" autoplay muted loop style="opacity: 0.6;" 
                          onended="if(this.loop){this.currentTime=0;this.play()}" 
                          onloadedmetadata="this.playbackRate=1.0">
                         <source src="${item.source_url}" type="video/mp4">
                      </video>
                  `
            }
        } else if (item.type === 'image') {
            return `<img src="${item.source_url}" class="w-full h-full object-cover mb-blur" style="opacity: 0.6;">`
        }
        return ''
    }

    clearBackground() {
        if (!this.currentBgId) return
        this.currentBgId = null
        const layer = this.element.querySelector('#layer-background')
        if (layer) layer.innerHTML = ''
    }

    renderContent() {
        const layer = this.element.querySelector('#layer-content')
        if (!layer) return

        // Cross-Dissolve Implementation
        // 1. Create a specific invalidating container if not exists
        if (!this.currentItem) {
            // Fade out everything
            Array.from(layer.children).forEach((child) => {
                (child as HTMLElement).style.opacity = '0'
                setTimeout(() => child.remove(), 500)
            })
            return
        }

        // 2. Create new content wrapper
        const newPage = document.createElement('div')
        newPage.className = 'absolute inset-0 transition-opacity duration-300 opacity-0 flex items-center justify-center'

        // Render into newPage
        switch (this.currentItem.type) {
            case 'song':
                this.renderSong(this.currentItem as any, newPage)
                break
            case 'scripture':
                this.renderText(this.currentItem as any, newPage)
                break
            case 'image':
                this.renderImage(this.currentItem as any, newPage)
                break
            case 'video':
                this.renderVideo(this.currentItem as any, newPage)
                break
            case 'presentation':
                this.renderPresentation(this.currentItem as any, newPage)
                break
            default:
                newPage.innerHTML = `<div class="text-4xl text-gray-800">${this.currentItem.type}</div>`
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

    renderSong(song: any, container: Element) {
        // Mocking: Just show all parts scrolling for now or a specific active part
        // In real app we listen to `slide_index`
        const div = document.createElement('div')
        div.className = 'w-full h-full flex items-center justify-center p-16 text-center'

        // For Verification: Show the first part or "Chorus"
        const part = song.parts[0]

        div.innerHTML = `
            <div class="font-bold text-6xl leading-tight drop-shadow-xl" style="text-shadow: 0 4px 6px rgba(0,0,0,0.8);">
                ${part.lyrics.replace(/\n/g, '<br/>')}
            </div>
        `
        container.appendChild(div)
    }

    renderText(scripture: any, container: Element) {
        const div = document.createElement('div')
        div.className = 'w-full h-full flex flex-col items-center justify-center p-24 text-center'

        div.innerHTML = `
            <div class="font-serif text-7xl leading-snug mb-8 drop-shadow-2xl text-white" style="text-shadow: 0 4px 6px rgba(0,0,0,1);">
                "${scripture.text_content}"
            </div>
            <div class="text-4xl text-yellow-500 font-bold uppercase tracking-widest drop-shadow-lg" style="text-shadow: 0 2px 4px rgba(0,0,0,1);">
                ${scripture.reference_title}
            </div>
        `
        container.appendChild(div)
    }

    renderImage(image: any, container: Element) {
        const img = document.createElement('img')
        img.src = image.source_url
        img.className = 'w-full h-full object-contain'
        if (image.scaling_mode === 'fill') img.className = 'w-full h-full object-cover'
        container.appendChild(img)
    }

    renderPresentation(presentation: any, container: Element) {
        if (presentation.data?.is_canva && presentation.source_url) {
            const div = document.createElement('div')
            div.className = 'w-full h-full bg-black'
            div.innerHTML = `
                <iframe src="${presentation.source_url}" class="w-full h-full border-0" allow="fullscreen" allowfullscreen></iframe>
             `
            container.appendChild(div)
        } else if (presentation.data?.slides) {
            // Local Deck - Need to show ONE slide based on state.livePosition
            // For now, default to first or handle "no active slide"
            // Since we don't have robust livePosition syncing yet in this class, just show first slide for Verify
            const slideIndex = store.state.live.slide_index || 0
            const slide = presentation.data.slides[slideIndex]

            if (slide) {
                const img = document.createElement('img')
                img.src = slide.source_url
                img.className = 'w-full h-full object-contain'
                container.appendChild(img)
            }
        }
    }

    renderVideo(video: any, container: Element) {
        const div = document.createElement('div')
        div.className = 'w-full h-full flex flex-col items-center justify-center bg-black'

        if (video.is_youtube && video.source_url.includes('youtube.com')) {
            let videoId = video.source_url.split('v=')[1]
            if (!videoId) videoId = video.file_hash.replace('youtube-ref-', '')

            // Autoplay = 1, Controls = 0, ModestBranding = 1
            // TODO: Handle 'start' and 'end' params from video.trim_start
            const startParam = video.trim_start ? `&start=${video.trim_start}` : ''
            const endParam = video.trim_end ? `&end=${video.trim_end}` : ''

            div.innerHTML = `
                <iframe 
                    width="100%" 
                    height="100%" 
                    src="https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0&modestbranding=1&rel=0${startParam}${endParam}" 
                    title="YouTube video player" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen
                    style="pointer-events: none;" 
                ></iframe>
            `
        } else {
            // Local Video
            div.innerHTML = `
                 <video class="w-full h-full object-contain" autoplay>
                    <source src="${video.source_url}" type="video/mp4">
                 </video>
            `
            // Ensure loop if set
            const v = div.querySelector('video')
            if (v && video.is_loop) v.loop = true
            if (v && video.volume_multiplier) v.volume = video.volume_multiplier
        }
        container.appendChild(div)
    }

    clear() {
        this.currentItem = null
        const layer = this.element.querySelector('#layer-content')
        if (layer) layer.innerHTML = ''
    }
}
