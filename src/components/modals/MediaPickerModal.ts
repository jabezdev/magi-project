import { store } from '../../state/store'
import { ICONS } from '../../constants/icons'
import { LibraryItem } from '../../types'

export interface MediaPickerOptions {
    title?: string
    filterType?: 'video' | 'image' | 'all'
    onSelect: (item: LibraryItem) => void
    onCancel?: () => void
}

/**
 * MediaPickerModal - A reusable modal to select items from the library
 * Used for Background selection, Media Slides, etc.
 */
export class MediaPickerModal {
    element: HTMLElement
    options: MediaPickerOptions
    searchQuery: string = ''
    items: LibraryItem[] = []

    constructor(options: MediaPickerOptions) {
        this.options = { ...options }

        this.element = document.createElement('div')
        this.element.className = 'fixed inset-0 z-[70] bg-[#09090b]/90 flex items-center justify-center p-4 backdrop-blur-sm'

        // Initial Fetch
        this.items = store.library.filter(i => {
            if (this.options.filterType === 'all') return true
            if (this.options.filterType === 'video') return i.type === 'video'
            if (this.options.filterType === 'image') return i.type === 'image'
            return true
        })

        this.render()
        document.body.appendChild(this.element)

        // Focus search
        setTimeout(() => this.element.querySelector<HTMLInputElement>('input')?.focus(), 50)
    }

    render() {
        this.element.innerHTML = `
            <div class="bg-[#18181b] w-full max-w-4xl h-[80vh] rounded-xl border border-zinc-700 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                <!-- Header -->
                <div class="h-14 border-b border-zinc-700 flex items-center justify-between px-4 bg-[#18181b] shrink-0">
                     <h2 class="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                        <span class="text-purple-500 w-5 h-5">${ICONS.search}</span> ${this.options.title || 'Select Media'}
                     </h2>
                     <div class="flex items-center gap-2 flex-1 max-w-md mx-4">
                        <input type="text" id="picker-search" 
                            class="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-sm text-zinc-200 focus:border-purple-500 focus:outline-none placeholder-zinc-600"
                            placeholder="Search..." value="${this.searchQuery}"
                        />
                     </div>
                     <button id="btn-close" class="text-zinc-500 hover:text-white w-8 h-8 flex items-center justify-center rounded hover:bg-zinc-800 transition-colors">
                        ${ICONS.close}
                     </button>
                </div>

                <!-- Grid -->
                <div class="flex-1 overflow-y-auto p-4 custom-scrollbar bg-[#0c0c0e]" id="picker-grid">
                    <!-- Grid Content -->
                </div>
            </div>
        `

        this.renderGrid()
        this.attachListeners()
    }

    renderGrid() {
        const grid = this.element.querySelector('#picker-grid')
        if (!grid) return
        grid.innerHTML = ''

        const filtered = this.items.filter(item => {
            if (!this.searchQuery) return true
            return item.title.toLowerCase().includes(this.searchQuery) ||
                item.tags.some(t => t.toLowerCase().includes(this.searchQuery))
        })

        if (filtered.length === 0) {
            grid.innerHTML = `<div class="w-full h-full flex flex-col items-center justify-center text-zinc-600">
                <div class="text-4xl mb-2 opacity-30">🔍</div>
                <div class="text-sm">No items found</div>
            </div>`
            grid.className = 'flex-1 overflow-y-auto p-4 custom-scrollbar bg-[#0c0c0e] flex' // Flex center
            return
        }

        // Restore grid layout
        grid.className = 'flex-1 overflow-y-auto p-4 custom-scrollbar bg-[#0c0c0e] grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 content-start'

        filtered.forEach(item => {
            const el = document.createElement('div')
            el.className = 'aspect-video bg-zinc-800 rounded border border-zinc-700 hover:border-purple-500 hover:ring-2 hover:ring-purple-500/20 cursor-pointer relative group overflow-hidden transition-all'

            // Thumbnail Logic
            let thumbnail = ''
            if (item.type === 'image') {
                thumbnail = `<img src="${(item as any).source_url}" class="w-full h-full object-cover" loading="lazy" />`
            } else if (item.type === 'video') {
                // If we had thumbnails, we'd use them. For now, use a placeholder or video tag
                if ((item as any).thumbnail_path) {
                    thumbnail = `<img src="${(item as any).thumbnail_path}" class="w-full h-full object-cover" loading="lazy" />`
                } else {
                    thumbnail = `<div class="w-full h-full bg-zinc-900 flex items-center justify-center text-zinc-700 group-hover:text-purple-500 transition-colors">${ICONS.video}</div>`
                }
            }

            el.innerHTML = `
                ${thumbnail}
                <div class="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent opacity-100 flex flex-col justify-end p-2 transition-opacity">
                    <div class="text-[10px] font-bold text-white truncate w-full">${item.title}</div>
                    <div class="text-[9px] text-zinc-400 capitalize flex items-center gap-1">
                        <span class="w-3 h-3 opacity-70">${item.type === 'video' ? ICONS.video : ICONS.image}</span>
                        ${item.type}
                    </div>
                </div>
            `

            el.addEventListener('click', () => {
                this.options.onSelect(item)
                this.close()
            })

            grid.appendChild(el)
        })
    }

    attachListeners() {
        this.element.querySelector('#btn-close')?.addEventListener('click', () => {
            if (this.options.onCancel) this.options.onCancel()
            this.close()
        })

        const input = this.element.querySelector('#picker-search') as HTMLInputElement
        input?.addEventListener('input', (e) => {
            this.searchQuery = (e.target as HTMLInputElement).value.toLowerCase()
            this.renderGrid()
        })

        // Close on backdrop click
        this.element.addEventListener('click', (e) => {
            if (e.target === this.element) {
                if (this.options.onCancel) this.options.onCancel()
                this.close()
            }
        })
    }

    close() {
        this.element.classList.add('opacity-0', 'scale-95')
        setTimeout(() => this.element.remove(), 150)
    }
}

export function openMediaPicker(options: MediaPickerOptions) {
    new MediaPickerModal(options)
}
