import { store } from '../state/store'
import { LibraryItem, GlobalSettings } from '../types'
import { api } from '../services/api'

export class ConfidenceMonitor {
    element: HTMLElement
    private currentItem: LibraryItem | null = null
    private _clockIntervalId: ReturnType<typeof setInterval> | null = null
    private currentSlideIndex: number = 0
    private _currentSettings: GlobalSettings | null = null

    constructor() {
        this.element = document.createElement('div')
        this.element.className = 'w-full h-full bg-black text-white flex flex-col overflow-hidden font-sans'

        this.renderShell()
        this.startClock()

        // Subscribe to settings changes
        store.subscribeSettings((settings) => {
            this._currentSettings = settings
            this.applySettings(settings)
        })

        store.subscribe(state => {
            // Update Live Item
            if (state.live.item_id !== this.currentItem?.id) {
                if (state.live.item_id) {
                    this.currentSlideIndex = 0 // Reset on new item
                    this.loadItem(state.live.item_id)
                } else {
                    this.clear()
                }
            } else {
                // Same item, check index
                if (state.live.slide_index !== undefined && state.live.slide_index !== this.currentSlideIndex) {
                    this.currentSlideIndex = state.live.slide_index
                    this.renderContent()
                }
            }
        })
    }

    /**
     * Apply settings to the screen's CSS variables
     */
    private applySettings(settings: GlobalSettings) {
        const confSettings = settings.confidenceMonitorSettings
        const el = this.element

        // Apply font settings
        el.style.setProperty('--conf-font-family', confSettings.fontFamily)
        el.style.setProperty('--conf-font-size', `${confSettings.fontSize}rem`)
        el.style.setProperty('--conf-line-height', `${confSettings.lineHeight}`)
        el.style.setProperty('--conf-prev-next-opacity', `${confSettings.prevNextOpacity}`)
        el.style.setProperty('--conf-clock-size', `${confSettings.clockSize}rem`)
        el.style.setProperty('--conf-part-gap', `${confSettings.partGap}rem`)
        el.style.setProperty('--conf-slide-gap', `${confSettings.slideGap}rem`)

        // Apply margins
        el.style.setProperty('--conf-margin-top', `${confSettings.marginTop}rem`)
        el.style.setProperty('--conf-margin-bottom', `${confSettings.marginBottom}rem`)
        el.style.setProperty('--conf-margin-left', `${confSettings.marginLeft}rem`)
        el.style.setProperty('--conf-margin-right', `${confSettings.marginRight}rem`)
    }


    renderShell() {
        // Teleprompter Layout: 
        // Top: Previous Slides (Dimmed)
        // Middle: Current Slide (High Vis)
        // Bottom: Next Slides (Dimmed) + Arrangement Strip
        // Footer: Clock + Next Item
        this.element.innerHTML = `
            <div id="conf-content" class="flex-1 flex flex-col relative overflow-hidden">
                <!-- Previous Slides (scrolled up) -->
                <div id="conf-prev" class="h-24 bg-gray-900/50 flex items-center justify-center px-6 opacity-40 overflow-hidden border-b border-gray-800">
                </div>

                <!-- Current Slide -->
                <div id="conf-current" class="flex-1 flex flex-col p-8 items-center justify-center text-center bg-black">
                     <div class="text-gray-500 text-xl animate-pulse">Waiting for Live Content...</div>
                </div>

                <!-- Next Slides -->
                <div id="conf-next" class="h-24 bg-gray-900/50 flex items-center justify-center px-6 opacity-50 overflow-hidden border-t border-gray-800">
                </div>

                <!-- Arrangement Strip -->
                <div id="conf-arrangement" class="bg-[#111] border-t border-gray-800 px-4 py-2 flex gap-1 overflow-x-auto hidden">
                </div>
            </div>

            <!-- Footer: Clock & Status -->
            <div class="h-16 bg-[#111] border-t border-gray-800 flex justify-between items-center px-8 shrink-0">
                 <div class="flex items-center gap-4 overflow-hidden">
                     <div id="conf-msg" class="text-lg font-bold text-blue-500 truncate max-w-md"></div>
                     <div class="text-gray-600 text-sm" id="conf-slide-info"></div>
                 </div>
                 <div class="flex items-center gap-6">
                     <div id="conf-next-item" class="text-sm text-gray-500">NEXT: <span class="text-white font-bold">--</span></div>
                     <div id="conf-clock" class="text-4xl font-bold font-mono text-yellow-500 tracking-wider">--:--</div>
                 </div>
            </div>
            </div>
        `
    }

    startClock() {
        const update = () => {
            const now = new Date()
            // 12-hour format
            let hours = now.getHours()
            const ampm = hours >= 12 ? 'PM' : 'AM'
            hours = hours % 12
            hours = hours ? hours : 12 // the hour '0' should be '12'
            const minutes = now.getMinutes().toString().padStart(2, '0')

            const timeString = `${hours}:${minutes} <span class="text-xl text-gray-500 align-top">${ampm}</span>`
            const el = this.element.querySelector('#conf-clock')
            if (el) el.innerHTML = timeString
        }
        update()
        this._clockIntervalId = setInterval(update, 1000)
    }

    async loadItem(id: string) {
        try {
            // Check cache first
            let item = store.library.find(i => i.id === id)
            if (!item) item = await api.library.get(id)

            this.currentItem = item

            // Sync initial index if coming from store state (e.g. joined late)
            this.currentSlideIndex = store.state.live.slide_index || 0

            this.renderContent()
        } catch (e) {
            console.error(e)
        }
    }

    renderContent() {
        const currentContainer = this.element.querySelector('#conf-current')
        const nextContainer = this.element.querySelector('#conf-next')
        const prevContainer = this.element.querySelector('#conf-prev')
        const arrStrip = this.element.querySelector('#conf-arrangement')
        const msgEl = this.element.querySelector('#conf-msg')
        const infoEl = this.element.querySelector('#conf-slide-info')

        if (!currentContainer || !nextContainer || !this.currentItem) return

        const item = this.currentItem as any // Use any for dynamic property access
        if (msgEl) msgEl.textContent = item.title

        // Type specific rendering
        if (item.type === 'song' || (item.type === 'presentation' && item.data?.slides) || (item.type === 'scripture' && item.data?.slides)) {
            this.renderSlideFlow(item, currentContainer, nextContainer, prevContainer, arrStrip, infoEl)
        } else if (item.type === 'video' || item.type === 'image') {
            this.renderMediaStatus(item, currentContainer, nextContainer)
            if (prevContainer) prevContainer.innerHTML = ''
            if (arrStrip) arrStrip.classList.add('hidden')
        } else if (item.type === 'presentation' && item.data?.is_canva) {
            this.renderSimpleStatus("CANVA PRESENTATION", "Interactive Mode", currentContainer, nextContainer)
            if (prevContainer) prevContainer.innerHTML = ''
            if (arrStrip) arrStrip.classList.add('hidden')
        } else {
            this.renderSimpleStatus(item.type.toUpperCase(), item.title, currentContainer, nextContainer)
            if (prevContainer) prevContainer.innerHTML = ''
            if (arrStrip) arrStrip.classList.add('hidden')
        }
    }

    renderSlideFlow(item: any, currentEl: Element, nextEl: Element, prevEl: Element | null, arrStrip: Element | null, infoEl: Element | null) {
        let slides: any[] = []

        if (item.type === 'song') {
            slides = item.parts // Assuming parts act as slides 1:1 for now
        } else if (item.data?.slides) {
            slides = item.data.slides
        }

        const count = slides.length
        if (infoEl) infoEl.textContent = `${this.currentSlideIndex + 1} / ${count}`

        // Current
        const currentSlide = slides[this.currentSlideIndex]
        if (currentSlide) {
            if (item.type === 'song' || item.type === 'scripture') {
                // Text based
                const text = currentSlide.lyrics || currentSlide.text || ''
                const label = currentSlide.label || ''
                currentEl.innerHTML = `
                    <div class="text-sm text-yellow-500 font-bold uppercase mb-2 tracking-widest">${label}</div>
                    <div class="text-5xl font-bold leading-snug text-white whitespace-pre-wrap max-w-4xl">${text}</div>
                 `
                // Add subtle border to indicate activity
                currentEl.className = "flex-1 flex flex-col p-8 items-center justify-center text-center bg-black border-l-8 border-yellow-500"

            } else {
                // Image based (Presentation)
                currentEl.innerHTML = `
                     <div class="h-full flex flex-col items-center justify-center">
                        <img src="${currentSlide.source_url}" class="max-h-full max-w-full object-contain" />
                        <div class="text-sm text-gray-500 mt-2">SLIDE ${this.currentSlideIndex + 1}</div>
                     </div>
                `
                currentEl.className = "flex-1 flex flex-col p-8 items-center justify-center text-center bg-black border-l-8 border-blue-500"
            }
        } else {
            currentEl.innerHTML = `<div class="text-gray-500 text-2xl">End of Content</div>`
            currentEl.className = "flex-1 flex flex-col p-8 items-center justify-center text-center bg-black"
        }

        // Next
        const nextSlide = slides[this.currentSlideIndex + 1]
        nextEl.innerHTML = ''
        if (nextSlide) {
            if (item.type === 'song' || item.type === 'scripture') {
                const text = nextSlide.lyrics || nextSlide.text || ''
                nextEl.innerHTML = `
                    <div class="text-xs text-gray-400 font-bold uppercase mb-1">NEXT: ${nextSlide.label || 'SLIDE'}</div>
                    <div class="text-2xl font-medium text-gray-300 whitespace-pre-wrap line-clamp-3">${text}</div>
                  `
            } else {
                nextEl.innerHTML = `
                     <div class="h-full flex flex-col items-center justify-center opacity-50">
                        <img src="${nextSlide.source_url}" class="max-h-full max-w-full object-contain" />
                        <div class="text-xs text-gray-500 mt-1">NEXT SLIDE</div>
                     </div>
                  `
            }
        } else {
            nextEl.innerHTML = `<div class="text-gray-600 italic">End of Item</div>`
        }

        // Previous Slide
        if (prevEl) {
            const prevSlide = slides[this.currentSlideIndex - 1]
            if (prevSlide) {
                const text = prevSlide.lyrics || prevSlide.text || ''
                prevEl.innerHTML = `
                    <div class="text-xs text-gray-500 uppercase">PREV: ${prevSlide.label || ''}</div>
                    <div class="text-lg text-gray-400 truncate max-w-lg">${text.substring(0, 60)}...</div>
                `
            } else {
                prevEl.innerHTML = `<div class="text-gray-700 text-sm">Start</div>`
            }
        }

        // Arrangement Strip for songs
        if (arrStrip && item.type === 'song') {
            arrStrip.classList.remove('hidden')
            arrStrip.innerHTML = ''

            const colorMap: Record<string, string> = {
                'VERSE': 'bg-blue-600',
                'CHORUS': 'bg-red-600',
                'PRE-CHORUS': 'bg-purple-600',
                'BRIDGE': 'bg-orange-600',
                'INTRO': 'bg-teal-600',
                'OUTRO': 'bg-gray-600'
            }

            slides.forEach((part: any, index: number) => {
                const isActive = this.currentSlideIndex === index
                const partType = (part.label || '').toUpperCase().split(' ')[0]
                const color = colorMap[partType] || 'bg-gray-600'

                const block = document.createElement('div')
                block.className = `px-3 py-1 rounded text-xs font-bold text-white ${color} ${isActive ? 'ring-2 ring-yellow-400 scale-105' : 'opacity-50'}`
                block.textContent = part.label || `S${index + 1}`
                arrStrip.appendChild(block)
            })
        } else if (arrStrip) {
            arrStrip.classList.add('hidden')
        }
    }

    renderMediaStatus(item: any, currentEl: Element, nextEl: Element) {
        currentEl.className = "flex-1 flex flex-col p-8 items-center justify-center text-center bg-black border-l-8 border-green-500"
        currentEl.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full">
                 <div class="text-6xl mb-6">🎥</div>
                 <div class="text-4xl font-bold text-green-500 mb-2">MEDIA PLAYING</div>
                 <div class="text-xl text-gray-400 max-w-2xl">${item.title}</div>
            </div>
         `
        nextEl.innerHTML = `<div class="text-gray-600">---</div>`
    }

    renderSimpleStatus(title: string, subtitle: string, currentEl: Element, nextEl: Element) {
        currentEl.className = "flex-1 flex flex-col p-8 items-center justify-center text-center bg-black"
        currentEl.innerHTML = `
             <div class="text-3xl text-gray-300 font-bold mb-2">${title}</div>
             <div class="text-xl text-gray-500">${subtitle}</div>
         `
        nextEl.innerHTML = ''
    }

    clear() {
        this.currentItem = null
        const container = this.element.querySelector('#conf-current')
        const nextContainer = this.element.querySelector('#conf-next')
        const msgEl = this.element.querySelector('#conf-msg')

        if (msgEl) msgEl.textContent = ''
        if (container) {
            container.className = "flex-1 flex flex-col p-8 items-center justify-center text-center bg-black"
            container.innerHTML = '<div class="text-gray-600 text-2xl animate-pulse">Waiting for Live Content...</div>'
        }
        if (nextContainer) nextContainer.innerHTML = ''
    }
}
