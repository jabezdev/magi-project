
import { ICONS } from '../constants/icons'
import { store } from '../state/store'

export class UtilityPanelManager {
    element: HTMLElement
    private resizerElement: HTMLElement | null = null
    private context: 'preview' | 'live'
    private searchQuery: string = ''

    constructor(mountPoint: HTMLElement | string, resizerPoint: HTMLElement | string | null, context: 'preview' | 'live') {
        this.context = context

        // Resolve Mount Point
        if (typeof mountPoint === 'string') {
            const el = document.getElementById(mountPoint)
            if (!el) {
                console.error(`UtilityPanelManager: Mount point ID "${mountPoint}" not found in document.`)
                this.element = document.createElement('div')
            } else {
                this.element = el
            }
        } else {
            this.element = mountPoint
        }

        // Resolve Resizer Point
        if (resizerPoint) {
            if (typeof resizerPoint === 'string') {
                this.resizerElement = document.getElementById(resizerPoint)
            } else {
                this.resizerElement = resizerPoint
            }
        }


        // Initial State Check
        this.checkVisibility()
        this.render()

        // Subscribe to Store
        // Subscribe to State (Selection changes)
        // Subscribe to State (Selection changes)
        store.subscribe(() => {
            this.checkVisibility()
            this.render()
        })

        // Subscribe to Library (Data loading/Updates) - Fixes "Not loading in" race condition
        store.subscribeLibrary(() => {
            this.render() // Re-render content if library items appear
            // Note: Visibility depends on IDs in State, which shouldn't change just because Library loaded,
            // but if we were waiting for an item to exist to Render it, we need this.
            // Actually checkVisibility only checks if ID exists. render() checks if object exists.
        })
    }

    checkVisibility() {
        console.log(`UtilityPanelManager (${this.context}): checkVisibility called`)
        // If context is Preview, check Preview Item. 
        // If context is Live, check Live Item.
        const state = store.state
        let hasItem = false

        if (this.context === 'preview') {
            hasItem = !!state.preview.item_id
        } else {
            hasItem = !!state.live.item_id
        }

        // The User requested: "when nothing is loaded, the panel is hidden."
        // So we toggle display.
        const displayStyle = hasItem ? 'flex' : 'none'

        if (this.element.style.display !== displayStyle) {
            console.log(`UtilityPanelManager (${this.context}): Visibility changed to ${displayStyle}`)
            this.element.style.display = displayStyle

            // Also hide the resizer if the panel is hidden, otherwise it looks weird
            if (this.resizerElement) {
                this.resizerElement.style.display = displayStyle
            }
        }
    }

    render() {
        console.log(`UtilityPanelManager (${this.context}): render called`)
        this.element.innerHTML = ''
        const state = store.state

        let item = null
        if (this.context === 'preview' && state.preview.item_id) {
            item = store.library.find(i => i.id === state.preview.item_id)
        } else if (this.context === 'live' && state.live.item_id) {
            item = store.library.find(i => i.id === state.live.item_id)
        }

        // Create Container
        const container = document.createElement('div')
        container.className = 'w-full h-full flex flex-col bg-[#111] border-t border-gray-800'

        if (!item) {
            // If we have an ID but found no Item, it means the Library hasn't loaded it yet.
            // Show a loader instead of empty black box.
            container.innerHTML = `<div class="p-4 text-gray-500 text-xs">Loading metadata...</div>`
            this.element.appendChild(container)
            return
        }

        // Add Label
        const labelColor = this.context === 'preview' ? 'blue' : 'red'
        this.addLabel(container, this.context.toUpperCase(), labelColor)

        // Render Content
        this.renderContent(container, item)

        this.element.appendChild(container)
    }

    private addLabel(container: HTMLElement, text: string, color: 'blue' | 'red') {
        const label = document.createElement('div')
        const bgClass = color === 'blue' ? 'bg-blue-900/80 text-blue-200' : 'bg-red-900/80 text-red-200'
        label.className = `absolute top-0 right-0 ${bgClass} text-[9px] px-1 z-10`
        label.innerText = text
        container.appendChild(label)
    }

    private renderContent(container: HTMLElement, item: any) {
        if (item.type === 'song' || item.type === 'scripture') {
            this.renderBackgroundPicker(container)
        } else if (['video', 'image', 'audio'].includes(item.type)) {
            this.renderMediaUtility(container, item)
        } else if (item.type === 'presentation') {
            this.renderPresentationUtility(container, item)
        } else {
            this.renderGenericInfo(container, item)
        }
    }

    renderBackgroundPicker(container: HTMLElement) {
        const context = this.context

        container.innerHTML = `
            <div class="panel-header flex justify-between items-center px-4 bg-gray-800 border-b border-gray-700 h-9 shrink-0 gap-2">
                <span class="text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">Backgrounds</span>
                
                <!-- SEARCH BAR -->
                <div class="relative flex-1 max-w-[200px]">
                     <span class="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">🔍</span>
                     <input type="text" id="bg-search-${context}" class="w-full bg-gray-900 border-none rounded-full py-1 pl-7 pr-3 text-xs text-gray-300 focus:ring-1 focus:ring-blue-500 outline-none" placeholder="Search..." value="${this.searchQuery}">
                </div>

                <div class="flex space-x-1">
                    <button id="btn-refresh-bg-${context}" class="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-700 text-gray-400" title="Refresh">↻</button>
                    <button id="btn-clear-bg-${context}" class="px-2 py-0.5 bg-red-900/40 text-red-400 hover:bg-red-900 hover:text-white rounded text-[10px] font-bold border border-red-900" title="Clear Background">CLEAR</button>
                </div>
            </div>
          
            <div class="flex-1 bg-[#111] p-2 overflow-y-auto grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2 content-start custom-scrollbar" id="bg-grid-${context}">
                 <!-- Loader -->
                 <div class="col-span-4 text-center text-gray-600 text-xs mt-4">Loading...</div>
            </div>
        `

        this.loadBackgrounds(container)

        // Events
        container.querySelector(`#bg-search-${context}`)?.addEventListener('input', (e) => {
            this.searchQuery = (e.target as HTMLInputElement).value
            this.loadBackgrounds(container)
        })

        container.querySelector(`#btn-refresh-bg-${context}`)?.addEventListener('click', () => this.loadBackgrounds(container))
        container.querySelector(`#btn-clear-bg-${context}`)?.addEventListener('click', () => {
            store.setActiveBackground(null)
            this.loadBackgrounds(container)
        })
    }

    async loadBackgrounds(container: HTMLElement) {
        const context = this.context
        const grid = container.querySelector(`#bg-grid-${context}`)
        if (!grid) return

        const library = await import('../services/api').then(m => m.api.library.list())
        let backgrounds = library.filter(i => i.type === 'video' || i.type === 'image')

        if (this.searchQuery) {
            const q = this.searchQuery.toLowerCase()
            backgrounds = backgrounds.filter(i => i.title.toLowerCase().includes(q))
        }

        if (backgrounds.length === 0) {
            grid.innerHTML = '<div class="col-span-4 text-center text-gray-600 text-xs mt-4">No media found.</div>'
            return
        }

        grid.innerHTML = backgrounds.map(item => {
            const isActive = store.state.active_background_id === item.id
            const isVideo = item.type === 'video'

            // Visual diff for Active state
            const activeClass = isActive ? 'border-red-500 shadow-[0_0_5px_rgba(239,68,68,0.4)]' : 'border-gray-800 hover:border-gray-500'

            return `
                <div class="aspect-video bg-black rounded border-2 ${activeClass} cursor-pointer overflow-hidden relative group bg-item select-none" data-id="${item.id}">
                    ${isVideo ? `<span class="absolute top-1 right-1 w-4 h-4 text-white drop-shadow-md z-10">${ICONS.video}</span>` : ''}
                    
                    ${item.type === 'image' || (item as any).thumbnail_path ?
                    `<img src="${(item as any).thumbnail_path || (item as any).source_url}" class="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity">` :
                    `<div class="w-full h-full flex items-center justify-center text-gray-500 font-bold text-xs p-2 text-center break-words bg-gray-900">${item.title}</div>`
                }
                    
                    ${isActive ? '<div class="absolute inset-0 border-2 border-red-500 pointer-events-none"></div>' : ''}
                    <div class="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-1">
                        <div class="text-[9px] text-gray-300 truncate px-1">${item.title}</div>
                    </div>
                </div>
            `
        }).join('')

        grid.querySelectorAll('.bg-item').forEach(el => {
            el.addEventListener('click', () => {
                const id = el.getAttribute('data-id')
                store.setActiveBackground(id)
            })
        })
    }

    renderMediaUtility(container: HTMLElement, item: any) {
        const isLive = this.context === 'live'
        // For now, these are dummy controls. In real impl, we'd bind to socket/store.

        container.innerHTML = `
            <div class="panel-header flex items-center justify-between px-4 bg-gray-800 border-b border-gray-700 h-9 shrink-0 gap-2">
                <span class="text-xs font-bold text-gray-400 uppercase tracking-wider">${item.type} Controls</span>
                <span class="text-xs text-gray-500 font-mono">${item.duration || '00:00'}</span>
            </div>
            
            <div class="flex-1 flex flex-col p-4 items-center justify-center gap-4">
                <!-- Transport -->
                <div class="flex items-center gap-4">
                     ${isLive ? `
                        <button class="w-12 h-12 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center text-white shadow-lg">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                        </button>
                        <button class="w-10 h-10 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-white">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12"/></svg>
                        </button>
                     ` : `
                        <button class="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center text-white">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                        </button>
                        <button class="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-white">
                             <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                        </button>
                     `}
                </div>

                <!-- Scrubber -->
                <div class="w-full flex flex-col gap-1">
                    <div class="flex justify-between text-[10px] text-gray-400 font-mono">
                        <span>00:00</span>
                        <span>-00:00</span>
                    </div>
                    <div class="w-full h-1 bg-gray-700 rounded overflow-hidden relative">
                        <div class="absolute top-0 left-0 h-full bg-gray-400 w-0"></div> <!-- Progress -->
                    </div>
                </div>

                <div class="text-[10px] text-gray-500">
                    ID: ${item.id}
                </div>
            </div>
        `
    }

    renderPresentationUtility(container: HTMLElement, item: any) {
        container.innerHTML = `
            <div class="panel-header flex items-center justify-between px-4 bg-gray-800 border-b border-gray-700 h-9 shrink-0 gap-2">
                <span class="text-xs font-bold text-gray-400 uppercase tracking-wider">Slide Navigator</span>
                 <span class="text-[10px] text-gray-500 truncate max-w-[100px]">${item.title}</span>
            </div>
             <div class="flex-1 flex overflow-hidden">
                <!-- Slide Grid -->
                <div class="flex-1 overflow-y-auto p-2 grid grid-cols-3 gap-2 content-start border-r border-gray-800">
                     <!-- Dummy Slides -->
                     ${[1, 2, 3, 4, 5, 6].map(n => `
                        <div class="aspect-video bg-gray-800 border border-gray-700 hover:border-blue-500 flex items-center justify-center text-xs text-gray-500 cursor-pointer">
                            Slide ${n}
                        </div>
                     `).join('')}
                </div>
                
                <!-- Notes -->
                <div class="w-1/3 bg-[#0a0a0a] p-2 flex flex-col">
                    <span class="text-[10px] font-bold text-gray-500 mb-1 uppercase">Speaker Notes</span>
                    <div class="flex-1 text-gray-400 text-xs overflow-y-auto">
                        No notes for current slide.
                    </div>
                </div>
            </div>
        `
    }

    renderGenericInfo(container: HTMLElement, item: any) {
        container.innerHTML = `
            <div class="panel-header flex items-center px-4 bg-gray-800 border-b border-gray-700 h-9 shrink-0 gap-2">
                <span class="text-xs font-bold text-gray-400 uppercase tracking-wider">Info</span>
            </div>
             <div class="p-4 text-gray-400 text-xs">
                Selected: ${item.title}
            </div>
        `
    }
}
