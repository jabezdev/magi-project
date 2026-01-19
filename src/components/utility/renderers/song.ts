import { UtilityRenderer, UtilityRendererContext } from '../types'
import { LibraryItem } from '../../../types'
import { store } from '../../../state/store'
import { ICONS } from '../../../constants/icons'
import { openImportMediaModal } from '../../modals/ImportMediaModal'

class SongUtilityRenderer implements UtilityRenderer {
    private searchQuery: string = ''
    private zoomLevel: number = 6 // Default grid columns
    private minZoom: number = 4
    private maxZoom: number = 10

    render(container: HTMLElement, _item: LibraryItem, ctx: UtilityRendererContext) {
        const context = ctx.context
        container.innerHTML = `
            <!-- Header: Label | Search+Import | Controls -->
            <div class="panel-header bg-[#09090b] flex h-10 select-none items-stretch shrink-0 relative z-20">
                
                <!-- Label Container (Bordered Right Only) -->
                <div class="px-3 flex items-center bg-gray-800 text-[10px] font-bold text-gray-400 border-r border-gray-700 whitespace-nowrap tracking-widest uppercase h-full">
                    Backgrounds
                </div>
                
                <!-- Search Area -->
                <div class="flex-1 min-w-0 bg-gray-900 border-none relative h-10 w-full focus-within:bg-black transition-colors">
                    <input type="text" id="bg-search-${context}" 
                        class="absolute inset-0 w-full h-full bg-transparent border-none px-3 text-xs text-gray-300 placeholder-gray-600 focus:ring-0 outline-none transition-colors z-10" 
                        placeholder="Search..." 
                        value="${this.searchQuery}"
                    />
                </div>    
                     <!-- Import Button (Blue +) -->
                    <button id="btn-import-bg-${context}" class="w-10 h-full aspect-square bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center justify-center text-lg border-l border-gray-700 shrink-0 transition-colors" title="Import Background">
                        +
                    </button>
                    </button>

                <!-- Right Controls: Clear | Refresh | Zoom Out | Zoom In -->
                <div class="flex items-center h-full gap-0 bg-gray-800 border-l border-gray-700">
                    
                    <!-- Clear Active -->
                    <button id="btn-stop-bg-${context}" class="w-10 h-full flex items-center justify-center text-red-500 hover:text-white hover:bg-red-900/50 transition-colors border-r border-gray-700" title="Clear Active Background">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path></svg>
                    </button>
                    
                    <!-- Refresh -->
                    <button id="btn-refresh-bg-${context}" class="w-10 h-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition-colors border-r border-gray-700" title="Refresh">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                    </button>

                    <!-- Zoom Out (-) -->
                    <button id="btn-zoom-out-${context}" class="w-10 h-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition-colors border-r border-gray-700" title="Zoom Out">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path></svg>
                    </button>

                    <!-- Zoom In (+) -->
                    <button id="btn-zoom-in-${context}" class="w-10 h-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition-colors" title="Zoom In">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path></svg>
                    </button>
                </div>
            </div>
            
            <!-- Bottom Border Separator (Explicit) -->
            <div class="h-px bg-gray-700 w-full shrink-0 relative z-20"></div>
          
            <div class="flex-1 bg-gray-900 p-0 overflow-y-auto grid gap-px content-start custom-scrollbar" style="grid-template-columns: repeat(${this.zoomLevel}, minmax(0, 1fr));" id="bg-grid-${context}">
                 <!-- Loader -->
                 <div class="col-span-full text-center text-gray-600 text-xs mt-4">Loading...</div>
            </div>
        `

        this.loadBackgrounds(container, context)

        // Events
        container.querySelector(`#bg-search-${context}`)?.addEventListener('input', (e) => {
            this.searchQuery = (e.target as HTMLInputElement).value
            this.loadBackgrounds(container, context)
        })

        container.querySelector(`#btn-import-bg-${context}`)?.addEventListener('click', () => {
            // For import, we default to media mode with background context if possible, 
            // but openImportMediaModal is generic. 
            openImportMediaModal()
        })

        container.querySelector(`#btn-stop-bg-${context}`)?.addEventListener('click', () => {
            store.setActiveBackground(null)
            this.loadBackgrounds(container, context) // Refresh to show active state removed
        })

        container.querySelector(`#btn-refresh-bg-${context}`)?.addEventListener('click', () => {
            this.loadBackgrounds(container, context)
        })

        // Zoom Events
        container.querySelector(`#btn-zoom-in-${context}`)?.addEventListener('click', () => {
            if (this.zoomLevel > this.minZoom) {
                this.zoomLevel--
                this.updateGridZoom(container, context)
            }
        })

        container.querySelector(`#btn-zoom-out-${context}`)?.addEventListener('click', () => {
            if (this.zoomLevel < this.maxZoom) {
                this.zoomLevel++
                this.updateGridZoom(container, context)
            }
        })
    }

    private updateGridZoom(container: HTMLElement, context: string) {
        const grid = container.querySelector(`#bg-grid-${context}`) as HTMLElement;
        if (grid) {
            grid.style.gridTemplateColumns = `repeat(${this.zoomLevel}, minmax(0, 1fr))`
        }
    }

    private async loadBackgrounds(container: HTMLElement, context: string) {
        const grid = container.querySelector(`#bg-grid-${context}`)
        if (!grid) return

        const library = store.library
        // Filter: Video/Image AND subtype='background'
        let backgrounds = library.filter(i => {
            if (i.type !== 'video' && i.type !== 'image') return false
            const iAny = i as any
            const isBg = (i.type === 'video' && iAny.video_subtype === 'background') ||
                (i.type === 'image' && iAny.image_subtype === 'background')
            return isBg
        })

        if (this.searchQuery) {
            const q = this.searchQuery.toLowerCase()
            backgrounds = backgrounds.filter(i => (i.title || '').toLowerCase().includes(q))
        }

        if (backgrounds.length === 0) {
            grid.innerHTML = '<div class="col-span-full text-center text-gray-600 text-xs mt-4">No backgrounds found. Import one!</div>'
            return
        }

        grid.innerHTML = backgrounds.map(item => {
            const isActive = store.state.active_background_id === item.id
            const isVideo = item.type === 'video'
            const thumbPath = (item as any).thumbnail_path
            // Handle missing thumbnails (fallback to API endpoint if remote, or just null)
            // Append timestamp to bust cache if thumb exists
            let thumbSrc = thumbPath || (item as any).source_url
            if (thumbPath) {
                thumbSrc += `?v=${new Date(item.updated_at || 0).getTime()}`
            }

            // Visual diff for Active state - Flushed style: Border Highlight + Opacity
            const activeClass = isActive
                ? 'ring-2 ring-inset ring-red-500 z-10 opacity-100'
                : 'opacity-60 hover:opacity-100'

            return `
                <div class="aspect-video bg-black relative cursor-pointer overflow-hidden group bg-item select-none transition-all ${activeClass}" data-id="${item.id}">
                    ${isVideo ? `<span class="absolute top-1 right-1 w-3 h-3 text-white drop-shadow-md z-10 opacity-70">${ICONS.video}</span>` : ''}
                    
                    ${item.type === 'image' || thumbPath ?
                    `<img src="${thumbSrc}" onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'" class="w-full h-full object-cover">
                     <div class="hidden w-full h-full flex items-center justify-center text-gray-600 font-bold text-[9px] p-2 text-center break-words bg-gray-950 border border-gray-800">${item.title}</div>
                    ` :
                    // If video has no thumbnail known, show Title on Dark BG
                    `<div class="w-full h-full flex items-center justify-center text-gray-600 font-bold text-[9px] p-2 text-center break-words bg-gray-950 border border-gray-800">${item.title}</div>`
                }
                    
                    <div class="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/90 via-black/50 to-transparent p-1 pt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div class="text-[9px] text-gray-300 truncate px-1">${item.title}</div>
                    </div>
                </div>
            `
        }).join('')

        grid.querySelectorAll('.bg-item').forEach(el => {
            el.addEventListener('click', () => {
                const id = el.getAttribute('data-id')
                if (id) store.setActiveBackground(id)
            })
        })
    }
}

export const songUtilityRenderer = new SongUtilityRenderer()
