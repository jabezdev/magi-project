import { store } from '../state/store'
import { LibraryItem } from '../types'
import { api } from '../services/api'

export class PreviewPanel {
    element: HTMLElement
    private currentItem: LibraryItem | null = null

    constructor() {
        this.element = document.createElement('div')
        this.element.className = 'flex flex-col h-full text-white'

        // Initial Render
        this.renderShell()

        // Subscribe to Store
        store.subscribe(state => {
            if (state.preview.item_id !== this.currentItem?.id) {
                if (state.preview.item_id) {
                    this.loadItem(state.preview.item_id)
                } else {
                    this.clear()
                }
            }
        })
    }

    renderShell() {
        this.element.innerHTML = `
            <div class="panel-header bg-gray-900 border-b border-gray-700 flex h-12 select-none items-stretch">
                <div class="px-4 flex items-center bg-gray-800 text-xs font-bold text-blue-500 border-r border-gray-700 whitespace-nowrap tracking-wider h-full">PREVIEW</div>
                <div class="flex-1 flex items-center justify-end bg-gray-900 h-full pl-2">
                    <button id="btn-go-live" class="h-full px-6 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors">
                        GO LIVE <span class="ml-2">→</span>
                    </button>
                </div>
            </div>
            <div id="preview-arrangement-strip" class="hidden bg-gray-800 border-b border-gray-700 px-2 py-1 gap-1 overflow-x-auto"></div>
            <div id="preview-content" class="flex-1 flex flex-col items-center justify-center bg-gray-900 overflow-hidden relative">
                <div class="text-gray-600 text-sm">Select an item to preview</div>
            </div>
        `

        this.element.querySelector('#btn-go-live')?.addEventListener('click', () => {
            store.goLive()
        })
    }

    async loadItem(id: string) {
        try {
            // Optimistically check library cache first
            let item = store.library.find(i => i.id === id)
            if (!item) {
                item = await api.library.get(id)
            }
            this.currentItem = item
            this.renderContent()
        } catch (e) {
            console.error('Failed to load item for preview', e)
        }
    }

    renderContent() {
        const container = this.element.querySelector('#preview-content')
        if (!container || !this.currentItem) return

        container.innerHTML = ''
        const item = this.currentItem

        // Context Info Overlay
        const info = document.createElement('div')
        info.className = 'absolute top-2 left-2 bg-black/50 px-2 py-1 rounded text-xs text-blue-200 z-10 pointer-events-none'
        info.innerHTML = `${item.title} <span class="opacity-50" > (${item.type})</span>`
        container.appendChild(info)

        // Switch render based on Type
        switch (item.type) {
            case 'song':
                this.renderSong(item as any, container)
                break
            case 'scripture':
                this.renderText(item as any, container)
                break
            case 'video':
            case 'image':
                this.renderMedia(item as any, container)
                break
            case 'presentation':
                this.renderPresentation(item as any, container)
                break
            default:
                container.innerHTML += `<div class="text-gray-500">Preview not implemented for ${item.type}</div>`
        }
    }

    renderSong(song: any, container: Element) {
        // Mock rendering song parts
        // In real impl, this would probably map through song.parts
        const wrapper = document.createElement('div')
        wrapper.className = 'w-full h-full overflow-y-auto p-4 space-y-2'

        song.parts.forEach((part: any, index: number) => {
            const div = document.createElement('div')
            div.className = 'bg-gray-800 p-2 rounded hover:bg-gray-700 cursor-pointer text-sm border border-transparent hover:border-blue-500 '
            div.innerHTML = `
                <div class="text-xs font-bold text-blue-400 mb-1">${part.label}</div>
                <div class="text-gray-300 whitespace-pre-wrap leading-relaxed">${part.lyrics}</div>
            `
            div.addEventListener('click', () => {
                // Set slide index in preview state
                store.setPreviewSlide(index)
            })
            wrapper.appendChild(div)
        })
        container.appendChild(wrapper)

        // Render Arrangement Strip
        this.renderArrangementStrip(song)
    }

    renderArrangementStrip(song: any) {
        const strip = this.element.querySelector('#preview-arrangement-strip')
        if (!strip) return

        strip.classList.remove('hidden')
        strip.classList.add('flex')
        strip.innerHTML = ''

        // Determine parts order from arrangement or default
        let slides: any[] = []
        if (song.arrangement && song.arrangement.length > 0) {
            song.arrangement.forEach((partId: string) => {
                const part = song.parts.find((p: any) => p.id === partId)
                if (part) slides.push(part)
            })
        } else {
            slides = song.parts
        }

        // Color map for part types
        const colorMap: Record<string, string> = {
            'VERSE': 'bg-blue-600',
            'CHORUS': 'bg-red-600',
            'PRE-CHORUS': 'bg-purple-600',
            'BRIDGE': 'bg-orange-600',
            'INTRO': 'bg-teal-600',
            'OUTRO': 'bg-gray-600',
            'TAG': 'bg-yellow-600',
            'CODA': 'bg-pink-600'
        }

        slides.forEach((part: any, index: number) => {
            const isActive = store.state.preview.slide_index === index
            const partType = (part.label || '').toUpperCase().split(' ')[0] // e.g., "VERSE 1" -> "VERSE"
            const color = colorMap[partType] || 'bg-gray-600'

            const block = document.createElement('button')
            block.className = `px-2 py-0.5 rounded text-[10px] font-bold text-white  ${color} ${isActive ? 'ring-2 ring-blue-400 scale-105' : 'opacity-60 hover:opacity-100'}`
            block.textContent = part.label || `S${index + 1}`
            block.addEventListener('click', () => store.setPreviewSlide(index))
            strip.appendChild(block)
        })
    }

    renderMedia(media: any, container: Element) {
        if (media.type === 'video') {
            const div = document.createElement('div')
            div.className = 'w-full h-full flex flex-col items-center justify-center bg-black'

            // Check for YouTube
            if (media.is_youtube && media.source_url.includes('youtube.com')) {
                // Extract ID again or store it on the object
                // source_url usually has it
                let videoId = media.source_url.split('v=')[1]
                if (!videoId) videoId = media.file_hash.replace('youtube-ref-', '')

                // Basic Embed
                div.innerHTML = `
                    <iframe 
                        width="100%" 
                        height="100%" 
                        src="https://www.youtube.com/embed/${videoId}?autoplay=0" 
                        title="YouTube video player" 
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen
                    ></iframe>
                `
            } else {
                // Local Video
                div.innerHTML = `
                     <video class="w-full h-full object-contain" controls onerror="this.outerHTML='<div class=\\"flex items-center justify-center w-full h-full bg-red-900/30 text-red-400 text-sm font-bold\\">⚠ VIDEO NOT FOUND</div>'">
                        <source src="${media.source_url}" type="video/mp4">
                        Your browser does not support the video tag.
                     </video>
                `
            }
            container.appendChild(div)
        } else {
            const img = document.createElement('img')
            img.src = media.source_url || 'placeholder.png' // TODO: Handle actual paths
            img.className = 'max-w-full max-h-full object-contain'
            container.appendChild(img)
        }
    }

    renderPresentation(presentation: any, container: Element) {
        if (presentation.data?.is_canva) {
            const div = document.createElement('div')
            div.className = 'w-full h-full bg-black'
            div.innerHTML = `
                <iframe src="${presentation.source_url}" class="w-full h-full border-0" allow="fullscreen" allowfullscreen></iframe>
             `
            container.appendChild(div)
        } else if (presentation.data?.slides) {
            // Local Deck - Render as list of slide thumbnails/rows
            const wrapper = document.createElement('div')
            wrapper.className = 'w-full h-full overflow-y-auto p-4 grid grid-cols-2 gap-4 content-start'

            presentation.data.slides.forEach((slide: any, index: number) => {
                const div = document.createElement('div')
                div.className = 'aspect-video bg-black rounded border border-gray-700 cursor-pointer hover:border-blue-500 relative group overflow-hidden'
                div.innerHTML = `
                    <img src="${slide.source_url}" class="w-full h-full object-cover">
                    <div class="absolute bottom-0 left-0 bg-black/50 text-white text-[10px] px-1">${index + 1}</div>
                 `
                div.addEventListener('click', () => {
                    store.setPreviewSlide(index)
                })
                wrapper.appendChild(div)
            })
            container.appendChild(wrapper)
        }
    }

    renderText(scripture: any, container: Element) {
        // Check if we have slides (New Format) or just text (Legacy/Fallback)
        if (scripture.slides && scripture.slides.length > 0) {
            const wrapper = document.createElement('div')
            wrapper.className = 'w-full h-full overflow-y-auto p-4 space-y-2'

            scripture.slides.forEach((slide: any, index: number) => {
                const div = document.createElement('div')
                div.className = 'bg-gray-800 p-2 rounded hover:bg-gray-700 cursor-pointer text-sm border border-transparent hover:border-blue-500 '
                div.innerHTML = `
                    <div class="text-xs font-bold text-yellow-500 mb-1">${slide.label || scripture.title}</div>
                    <div class="text-gray-300 whitespace-pre-wrap leading-relaxed font-serif text-lg">"${slide.text}"</div>
                `
                div.addEventListener('click', () => {
                    store.setPreviewSlide(index)
                })
                wrapper.appendChild(div)
            })
            container.appendChild(wrapper)
        } else {
            // Fallback
            const div = document.createElement('div')
            div.className = 'p-8 text-center max-w-lg'
            div.innerHTML = `
                 <div class="text-2xl font-serif mb-4 text-white">"${scripture.text_content || scripture.data?.text_content || ''}"</div>
                 <div class="text-yellow-500 font-bold tracking-widest text-sm uppercase">${scripture.reference_title || scripture.title}</div>
              `
            container.appendChild(div)
        }
    }

    clear() {
        this.currentItem = null
        const container = this.element.querySelector('#preview-content')
        if (container) container.innerHTML = '<div class="text-gray-600 text-sm">Select an item to preview</div>'
    }
}
