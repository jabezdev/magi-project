import { store } from '../state/store'
import { LibraryItem, SongItem } from '../types'
import { openSongEditor } from './modals/SongEditorModal'
import { openBibleBrowser } from './modals/BibleBrowserModal'
import { openImportMediaModal } from './modals/ImportMediaModal'
import { openYouTubeImportModal } from './modals/YouTubeImportModal'
import { openPresentationImportModal } from './modals/PresentationImportModal'
import { openContextMenu } from './ContextMenu'
import { openConfirmModal } from './modals/ConfirmModal'
import { ICONS } from '../constants/icons'
import { LibraryRendererRegistry } from './library/registry'
import { LibraryItemContext } from './library/types'

export class UnifiedLibrary {
    element: HTMLElement
    private items: LibraryItem[] = []
    private filterType: 'all' | 'song' | 'scripture' | 'media' | 'presentation' | 'background' = 'all'
    private searchQuery: string = ''

    constructor() {
        this.element = document.createElement('div')
        this.element.className = 'flex flex-col h-full bg-gray-900 text-white'

        // Initial Render Shell
        this.renderShell()

        // Subscribe to Store
        store.subscribeLibrary((items) => {
            this.items = items
            this.renderList()
        })
    }

    renderShell() {
        this.element.innerHTML = `
            <!-- Header: Text | Search | Add -->
            <div class="panel-header bg-gray-900 border-b border-gray-700 flex h-10 select-none items-stretch">
                <div class="px-3 flex items-center bg-gray-800 text-xs font-bold text-gray-400 border-r border-gray-700 whitespace-nowrap tracking-wider h-full">LIBRARY</div>
                <input type="text" id="lib-search" 
                    class="flex-1 bg-gray-900 border-none px-3 text-sm text-gray-300 focus:outline-none focus:bg-black  h-full min-w-0" 
                    placeholder="Search..."
                />
                <button id="btn-add-item" class="w-10 h-full aspect-square bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center justify-center  text-lg border-l border-gray-800 shrink-0">+</button>
            </div>

            <!-- Filter Tabs -->
            <div class="flex text-xs border-b border-gray-700 bg-gray-800 w-full">
                ${this.renderTab('all', 'All')}
                ${this.renderTab('song', 'Songs')}
                ${this.renderTab('scripture', 'Scripture')}
                ${this.renderTab('presentation', 'Slides')}
                ${this.renderTab('media', 'Media')}
                ${this.renderTab('background', 'Backgrounds')}
            </div>

            <!-- List Area -->
            <div id="lib-list" class="flex-1 overflow-y-auto p-0">
                <div class="text-center text-gray-500 text-sm mt-4">Loading...</div>
            </div>
        `

        // Bind Events
        this.element.querySelector('#lib-search')?.addEventListener('input', (e) => {
            this.searchQuery = (e.target as HTMLInputElement).value.toLowerCase()
            this.renderList()
        })

        this.element.querySelectorAll('.filter-tab').forEach(btn => {
            btn.addEventListener('click', () => {
                this.updateFilter(btn.getAttribute('data-type') as any)
            })
        })

        this.element.querySelector('#btn-add-item')?.addEventListener('click', (e) => {
            e.stopPropagation()

            // Toggle Popover
            const existing = document.getElementById('add-item-popover')
            if (existing) {
                existing.remove()
                return
            }

            const popover = document.createElement('div')
            popover.id = 'add-item-popover'
            popover.className = 'absolute z-50 bg-gray-800 border border-gray-700 shadow-xl flex flex-col py-0 min-w-[180px]'
            popover.innerHTML = `
                <button class="text-left px-2 py-2 hover:bg-gray-700 text-sm text-gray-200 hover:text-white  flex items-center gap-2 border-b border-gray-700" data-action="song">
                    <span class="w-4 h-4">${ICONS.music}</span> New Song
                </button>
                <button class="text-left px-2 py-2 hover:bg-gray-700 text-sm text-gray-200 hover:text-white  flex items-center gap-2 border-b border-gray-700" data-action="scripture">
                    <span class="w-4 h-4">${ICONS.book}</span> Scripture
                </button>
                <button class="text-left px-2 py-2 hover:bg-gray-700 text-sm text-gray-200 hover:text-white  flex items-center gap-2 border-b border-gray-700" data-action="media">
                    <span class="w-4 h-4">${ICONS.upload}</span> Import Media...
                </button>
                <button class="text-left px-2 py-2 hover:bg-gray-700 text-sm text-gray-200 hover:text-white  flex items-center gap-2 border-b border-gray-700" data-action="youtube">
                    <span class="w-4 h-4">${ICONS.youtube}</span> YouTube URL
                </button>
                 <button class="text-left px-2 py-2 hover:bg-gray-700 text-sm text-gray-200 hover:text-white  flex items-center gap-2" data-action="presentation">
                    <span class="w-4 h-4">${ICONS.slides}</span> Presentation
                </button>
            `

            // Position relative to button
            const btn = e.target as HTMLElement
            const rect = btn.getBoundingClientRect()

            popover.style.position = 'fixed'
            popover.style.top = `${rect.bottom + 8}px`
            popover.style.left = `${rect.right - 180}px`

            document.body.appendChild(popover)

            // Bind Actions
            popover.querySelectorAll('button').forEach(btn => {
                btn.addEventListener('click', () => {
                    const action = btn.getAttribute('data-action')
                    if (action === 'song') openSongEditor()
                    if (action === 'scripture') openBibleBrowser()
                    if (action === 'media') openImportMediaModal()
                    if (action === 'youtube') openYouTubeImportModal() // Wired up!
                    if (action === 'presentation') openPresentationImportModal()

                    popover.remove()
                })
            })

            // Close on click outside
            const closeHandler = () => {
                popover.remove()
                document.removeEventListener('click', closeHandler)
            }
            setTimeout(() => document.addEventListener('click', closeHandler), 0)
        })
    }

    renderTab(type: string, label: string) {
        const isActive = this.filterType === type
        return `
            <button class="filter-tab flex-auto px-3 py-2 whitespace-nowrap overflow-hidden text-ellipsis ${isActive ? 'bg-gray-700 text-white font-bold border-b-2 border-blue-500' : 'text-gray-400 hover:text-white'}" 
                data-type="${type}" title="${label}">
                ${label}
            </button>
        `
    }

    updateFilter(type: 'all' | 'song' | 'scripture' | 'media' | 'presentation' | 'background') {
        this.filterType = type

        // Update Tab UI
        const tabs = this.element.querySelectorAll('.filter-tab')
        tabs.forEach(t => {
            if (t.getAttribute('data-type') === type) {
                t.className = 'filter-tab flex-auto px-3 py-2 whitespace-nowrap overflow-hidden text-ellipsis bg-gray-700 text-white font-bold border-b-2 border-blue-500'
            } else {
                t.className = 'filter-tab flex-auto px-3 py-2 whitespace-nowrap overflow-hidden text-ellipsis text-gray-400 hover:text-white'
            }
        })

        this.renderList()
    }

    renderList() {
        const listContainer = this.element.querySelector('#lib-list')
        if (!listContainer) return

        const filtered = this.items.filter(item => {
            // Type Filter
            // Note: We cast to 'any' for subtypes to avoid TS errors without full type guards for every item
            const itemAny = item as any
            const isBackground = (item.type === 'video' && itemAny.video_subtype === 'background') ||
                (item.type === 'image' && itemAny.image_subtype === 'background')

            if (this.filterType === 'all') {
                // "All" view hides backgrounds and schedules by default
                if (isBackground) return false
                if (item.type === 'schedule') return false
                return true
            }

            if (this.filterType === 'song') return item.type === 'song'
            if (this.filterType === 'scripture') return item.type === 'scripture'

            if (this.filterType === 'media') {
                // Media = Video, Audio, Image (Content)
                if (item.type === 'audio') return true
                if (item.type === 'video' && !isBackground) return true
                if (item.type === 'image' && !isBackground) return true
                return false
            }

            if (this.filterType === 'presentation') {
                return item.type === 'presentation'
            }

            if (this.filterType === 'background') {
                return isBackground
            }

            return false

            // Fuzzy Search Filter
            if (this.searchQuery) {
                const score = this.fuzzyMatch(this.searchQuery, item)
                return score > 0
            }
            return true
        })

        // Sort by fuzzy relevance if searching
        if (this.searchQuery) {
            filtered.sort((a, b) => {
                const scoreA = this.fuzzyMatch(this.searchQuery, a)
                const scoreB = this.fuzzyMatch(this.searchQuery, b)
                return scoreB - scoreA // Higher score first
            })
        }

        if (filtered.length === 0) {
            listContainer.innerHTML = '<div class="text-center text-gray-500 text-sm mt-4">No items found</div>'
            return
        }

        listContainer.innerHTML = ''
        filtered.forEach(item => this.renderItem(item))
    }



    renderItem(item: LibraryItem) {
        const renderer = LibraryRendererRegistry.get(item.type)
        if (!renderer) return // Should not happen if all types registered

        const ctx: LibraryItemContext = {
            onPreview: (i) => store.setPreviewItem(i.id),
            onAddToSchedule: (i) => this.addItemToSchedule(i),
            onEdit: (i) => this.editItem(i),
            onDelete: (i) => this.deleteItem(i),
            onContextMenu: (e, i) => openContextMenu(e, this.getContextMenuItems(i)),
            searchQuery: this.searchQuery
        }

        const el = renderer.renderItem(item, ctx)
        this.element.querySelector('#lib-list')?.appendChild(el)
    }



    showSongArrangementPopover(originalEvent: MouseEvent, song: SongItem) {
        // Close existing
        document.getElementById('arrangement-popover')?.remove()

        const popover = document.createElement('div')
        popover.id = 'arrangement-popover'
        popover.className = 'absolute z-[60] bg-gray-800 border border-gray-700 shadow-xl rounded-lg overflow-hidden min-w-[200px] animate-in fade-in zoom-in-95 duration-100'

        const header = document.createElement('div')
        header.className = 'px-3 py-2 bg-gray-900 border-b border-gray-700 text-xs font-bold text-gray-400 uppercase tracking-wider'
        header.textContent = 'Select Arrangement'
        popover.appendChild(header)

        const list = document.createElement('div')
        list.className = 'flex flex-col'

        // Add Default
        // If no explicit arrangements, or just to ensure "Default" alias exists
        const arrangements = song.arrangements && song.arrangements.length > 0
            ? song.arrangements
            : [{ id: 'default', name: 'Default', is_default: true, sequence: [] }]

        arrangements.forEach(arr => {
            const btn = document.createElement('button')
            btn.className = 'text-left px-3 py-2 hover:bg-gray-700 text-sm text-gray-200 hover:text-white border-b border-gray-700 last:border-0 flex items-center justify-between group'
            btn.innerHTML = `
                <span>${arr.name}</span>
                <span class="text-xs text-gray-500 group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">Add</span>
            `

            btn.addEventListener('click', () => {
                window.dispatchEvent(new CustomEvent('add-to-schedule', {
                    detail: { ...song, _arrangement_id: arr.id } // Pass arrangement ID
                }))
                popover.remove()
            })
            list.appendChild(btn)
        })

        popover.appendChild(list)

        // Position
        const btn = originalEvent.currentTarget as HTMLElement
        const rect = btn.getBoundingClientRect()

        popover.style.position = 'fixed'
        // Align to right of button, or left if no space
        popover.style.top = `${rect.top}px`
        popover.style.left = `${rect.right + 8}px`

        // Boundary Check (Right edge)
        if (rect.right + 220 > window.innerWidth) {
            popover.style.left = `${rect.left - 210}px`
        }

        document.body.appendChild(popover)

        // Click outside to close
        const closeHandler = (e: MouseEvent) => {
            if (!popover.contains(e.target as Node) && e.target !== btn) {
                popover.remove()
                document.removeEventListener('click', closeHandler)
            }
        }
        setTimeout(() => document.addEventListener('click', closeHandler), 0)
    }

    private addItemToSchedule(item: LibraryItem) {
        if (item.type === 'song') {
            // For now dispatch directly
            window.dispatchEvent(new CustomEvent('add-to-schedule', { detail: item }))
        } else {
            window.dispatchEvent(new CustomEvent('add-to-schedule', { detail: item }))
        }
    }

    private editItem(item: LibraryItem) {
        if (item.type === 'song') openSongEditor(item as SongItem)
    }

    private async deleteItem(item: LibraryItem) {
        openConfirmModal({
            title: 'Delete Item',
            message: `Are you sure you want to delete "${item.title}" ?`,
            confirmText: 'Delete',
            danger: true,
            onConfirm: async () => {
                try {
                    const { api } = await import('../services/api')
                    await api.library.delete(item.id)
                    await store.refreshLibrary()
                } catch (err: any) {
                    const { openAlertModal } = await import('./modals/ConfirmModal')
                    openAlertModal({
                        title: 'Error',
                        message: 'Failed to delete item: ' + err.message,
                        type: 'error'
                    })
                }
            }
        })
    }

    private getContextMenuItems(item: LibraryItem): import('./ContextMenu').ContextMenuEntry[] {
        const items: import('./ContextMenu').ContextMenuEntry[] = []

        if (item.type === 'song') {
            items.push({
                label: 'Edit Song',
                icon: ICONS.edit,
                action: () => this.editItem(item)
            })
        }

        items.push({
            label: 'Add to Schedule',
            icon: ICONS.add,
            action: () => this.addItemToSchedule(item)
        })

        items.push({
            label: 'Preview',
            icon: ICONS.eye,
            action: () => store.setPreviewItem(item.id)
        })

        items.push({ divider: true })

        items.push({
            label: 'Delete',
            icon: ICONS.trash,
            danger: true,
            action: () => this.deleteItem(item)
        })

        return items
    }

    // Improved Fuzzy Matching
    fuzzyMatch(query: string, item: LibraryItem): number {
        const searchFields = [
            item.title,
            item.subtitle || '',
            // Include lyrics for songs
            ((item as any).parts || []).map((p: any) => p.lyrics || '').join(' ')
        ].join(' ').toLowerCase()

        const q = query.toLowerCase()
        if (!q) return 0

        // 1. Exact substring match (Highest Priority)
        if (searchFields.includes(q)) return 100

        // 2. Token Match (Split by space)
        const tokens = q.split(/\s+/).filter(t => t.length > 0)
        let tokenMatches = 0
        for (const token of tokens) {
            if (searchFields.includes(token)) tokenMatches++
        }

        // If we have multiple tokens and most match, return high score
        if (tokens.length > 0) {
            const matchRatio = tokenMatches / tokens.length
            if (matchRatio === 1) return 90 // All tokens present (any order)
            if (matchRatio >= 0.6) return 70 // Most tokens present
        }

        // 3. Relaxed Subsequence Match (Typo Tolerance)
        // Check how many characters of query appear in order in target
        let score = 0
        let queryIndex = 0
        let consecutiveBonus = 0

        for (let i = 0; i < searchFields.length && queryIndex < q.length; i++) {
            if (searchFields[i] === q[queryIndex]) {
                score += 1 + consecutiveBonus
                consecutiveBonus += 1
                queryIndex++
            } else {
                consecutiveBonus = 0
            }
        }

        const coverage = queryIndex / q.length // Percentage of query matched in order

        // If > 50% of query characters are found in sequence, consider it a match
        // (Allows skipping significant chunks: "amz grace" -> "Amazing Grace")
        if (coverage > 0.5) {
            return 40 + (coverage * 10)
        }

        return 0
    }
}

// Helper to get item from store (not efficient but checking id)

