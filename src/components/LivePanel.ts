import { store } from '../state/store'
import { LibraryItem } from '../types'
import { api } from '../services/api'
import { BehaviorRegistry } from '../behaviors'

export class LivePanel {
    element: HTMLElement
    private currentItem: LibraryItem | null = null

    constructor() {
        this.element = document.createElement('div')
        this.element.className = 'flex flex-col h-full text-white border-l border-gray-800'

        // Initial Render
        this.renderShell()

        // Subscribe to Store
        store.subscribe(state => {
            // Item Changed?
            if (state.live.item_id !== this.currentItem?.id) {
                if (state.live.item_id) {
                    this.loadItem(state.live.item_id)
                } else {
                    this.clear()
                }
            }
            // Slide Changed? (Re-render content to update highlights)
            // Ideally we'd just update classes, but re-render is cheap enough for text lists
            else if (state.live.item_id && state.live.slide_index !== undefined) {
                // Force re-render of current item to update highlights
                this.renderContent()
            }
        })
    }

    renderShell() {
        this.element.innerHTML = `
            <div class="panel-header bg-gray-900 border-b border-gray-700 flex h-10 select-none items-stretch">
                 <div class="px-3 flex items-center bg-gray-800 text-xs font-bold text-red-500 border-r border-gray-700 whitespace-nowrap tracking-wider h-full gap-2">
                    <span class="w-2 h-2 rounded-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.6)] animate-pulse"></span>
                    LIVE
                 </div>
                 
                 <!-- Info Area -->
                <div class="flex-1 flex flex-col justify-center px-4 overflow-hidden min-w-0">
                    <div id="live-header-title" class="text-sm font-bold text-white truncate leading-tight"></div>
                    <div id="live-header-subtitle" class="text-[10px] font-medium text-zinc-500 truncate leading-tight uppercase tracking-wider"></div>
                </div>

                 <div class="flex items-center justify-end bg-gray-900 h-full">
                    <div class="flex h-full text-[9px] font-bold">
                        <button id="btn-logo" class="output-btn w-14 h-full bg-gray-800 border-l border-gray-700 text-gray-400 hover:text-white flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-colors">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                            <span>LOGO</span>
                        </button>
                        <button id="btn-black" class="output-btn w-14 h-full bg-gray-800 border-l border-gray-700 text-gray-400 hover:text-white flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-colors">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path></svg>
                            <span>BLACK</span>
                        </button>
                        <button id="btn-clear" class="output-btn w-14 h-full bg-gray-800 border-l border-gray-700 text-gray-400 hover:text-white flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-colors">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            <span>CLEAR</span>
                        </button>
                        <button id="btn-restore" class="output-btn w-14 h-full bg-gray-800 border-l border-gray-700 text-gray-400 hover:text-white flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-colors">
                             <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            <span>PLAY</span>
                        </button>
                    </div>
                 </div>
            </div>
            <div id="live-arrangement-strip" class="hidden bg-gray-900 border-b border-gray-800 px-2 py-1 gap-1 overflow-x-auto"></div>
            <div id="live-content" class="flex-1 flex flex-col items-center justify-center bg-black overflow-hidden relative">
                <div class="text-gray-700 text-sm">No live content</div>
            </div>
        `

        // Wire Output Controls with Toggle Logic
        const btnLogo = this.element.querySelector('#btn-logo') as HTMLElement
        const btnBlack = this.element.querySelector('#btn-black') as HTMLElement
        const btnClear = this.element.querySelector('#btn-clear') as HTMLElement
        const btnPlay = this.element.querySelector('#btn-restore') as HTMLElement

        const allBtns = [btnLogo, btnBlack, btnClear, btnPlay]

        const resetButtonStyles = () => {
            allBtns.forEach(btn => {
                if (btn) {
                    btn.classList.remove('bg-blue-600', 'text-white')
                    btn.classList.add('bg-gray-800', 'text-gray-400')
                }
            })
        }

        const setActive = (btn: HTMLElement | null) => {
            resetButtonStyles()
            if (btn) {
                btn.classList.remove('bg-gray-800', 'text-gray-400')
                btn.classList.add('bg-blue-600', 'text-white')
            }
        }

        // Simple click feedback: brief brightness flash
        const flashFeedback = (btn: HTMLElement) => {
            btn.classList.add('brightness-150')
            setTimeout(() => btn.classList.remove('brightness-150'), 100)
        }

        // Initialize state (assuming normal play start)
        setActive(btnPlay)

        btnBlack?.addEventListener('click', () => {
            flashFeedback(btnBlack)
            if (btnBlack.classList.contains('bg-blue-600')) {
                store.restore()
                setActive(btnPlay)
            } else {
                store.toggleBlack()
                setActive(btnBlack)
            }
        })

        btnClear?.addEventListener('click', () => {
            flashFeedback(btnClear)
            if (btnClear.classList.contains('bg-blue-600')) {
                store.restore()
                setActive(btnPlay)
            } else {
                store.clearOverlays()
                setActive(btnClear)
            }
        })

        btnLogo?.addEventListener('click', () => {
            flashFeedback(btnLogo)
            if (btnLogo.classList.contains('bg-blue-600')) {
                store.restore()
                setActive(btnPlay)
            } else {
                store.toggleLogo()
                setActive(btnLogo)
            }
        })

        btnPlay?.addEventListener('click', () => {
            flashFeedback(btnPlay)
            store.restore()
            setActive(btnPlay)
        })
    }

    async loadItem(id: string) {
        try {
            let item = store.library.find(i => i.id === id)
            if (!item) {
                item = await api.library.get(id)
            }
            this.currentItem = item
            this.currentItem = item
            this.updateHeaderInfo()
            this.renderContent()
        } catch (e) {
            console.error('Failed to load item for live', e)
        }
    }

    renderContent() {
        const container = this.element.querySelector('#live-content') as HTMLElement;
        const stripContainer = this.element.querySelector('#live-arrangement-strip') as HTMLElement;

        if (!container || !this.currentItem) return

        container.innerHTML = ''
        const item = this.currentItem

        // Info Overlay REMOVED


        // Use Registry
        const behavior = BehaviorRegistry.get(item.type);
        if (behavior) {
            behavior.renderLive(item, container, stripContainer);
        } else {
            container.innerHTML += `<div class="text-gray-500">Content not implemented for ${item.type}</div>`
        }
    }

    clear() {
        this.currentItem = null
        this.updateHeaderInfo()
        const container = this.element.querySelector('#live-content')
        if (container) container.innerHTML = '<div class="text-gray-700 text-sm">No live content</div>'
        const strip = this.element.querySelector('#live-arrangement-strip')
        if (strip) strip.classList.add('hidden');
    }

    updateHeaderInfo() {
        const titleEl = this.element.querySelector('#live-header-title')
        const subEl = this.element.querySelector('#live-header-subtitle')

        if (this.currentItem) {
            if (titleEl) titleEl.textContent = this.currentItem.title

            // Generate sensible subtitle based on type
            let sub = this.currentItem.type.toUpperCase()
            if (this.currentItem.type === 'song') {
                sub = `${(this.currentItem as any).artist || 'Unknown Artist'}`
            }
            if (subEl) subEl.textContent = sub
        } else {
            if (titleEl) titleEl.textContent = ''
            if (subEl) subEl.textContent = ''
        }
    }
}
