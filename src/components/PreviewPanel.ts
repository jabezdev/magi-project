import { store } from '../state/store'
import { LibraryItem } from '../types'
import { api } from '../services/api'
import { BehaviorRegistry } from '../behaviors'

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
            <div class="panel-header bg-gray-900 border-b border-gray-700 flex h-10 select-none items-stretch">
                <div class="px-3 flex items-center bg-gray-800 text-xs font-bold text-blue-500 border-r border-gray-700 whitespace-nowrap tracking-wider h-full">PREVIEW</div>
                
                <!-- Info Area -->
                <div class="flex-1 flex flex-col justify-center px-4 overflow-hidden min-w-0">
                    <div id="preview-header-title" class="text-sm font-bold text-white truncate leading-tight"></div>
                    <div id="preview-header-subtitle" class="text-[10px] font-medium text-gray-500 truncate leading-tight uppercase tracking-wider"></div>
                </div>

                <div class="flex items-center justify-end bg-gray-900 h-full">
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

            this.currentItem = item
            this.updateHeaderInfo()
            this.renderContent()


        } catch (e) {
            console.error('Failed to load item for preview', e)
        }
    }

    renderContent() {
        const container = this.element.querySelector('#preview-content') as HTMLElement;
        const stripContainer = this.element.querySelector('#preview-arrangement-strip') as HTMLElement;

        if (!container || !this.currentItem) return

        container.innerHTML = ''
        const item = this.currentItem

        // Context Info Overlay REMOVED (Moved to header)


        // Use Registry
        const behavior = BehaviorRegistry.get(item.type);
        if (behavior) {
            behavior.renderPreview(item, container, stripContainer);
        } else {
            container.innerHTML += `<div class="text-gray-500">Preview not implemented for ${item.type}</div>`
        }
    }

    clear() {
        this.currentItem = null
        this.updateHeaderInfo()
        const container = this.element.querySelector('#preview-content')
        if (container) container.innerHTML = '<div class="text-gray-600 text-sm">Select an item to preview</div>'
        const strip = this.element.querySelector('#preview-arrangement-strip')
        if (strip) strip.classList.add('hidden');
    }

    updateHeaderInfo() {
        const titleEl = this.element.querySelector('#preview-header-title')
        const subEl = this.element.querySelector('#preview-header-subtitle')

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
