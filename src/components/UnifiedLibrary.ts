import { store } from '../state/store'
import { LibraryItem, MediaType, SongItem, VideoItem, ImageItem, PresentationItem, ScriptureItem } from '../types'
import { openSongEditor } from './modals/SongEditorModal'
import { openBibleBrowser } from './modals/BibleBrowserModal'
import { openImportMediaModal } from './modals/ImportMediaModal'
import { openYouTubeImportModal } from './modals/YouTubeImportModal'
import { openPresentationImportModal } from './modals/PresentationImportModal'
import { openContextMenu } from './ContextMenu'
import { openConfirmModal } from './modals/ConfirmModal'
import { ICONS } from '../constants/icons'

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

        listContainer.innerHTML = filtered.map(item => this.renderItem(item)).join('')

        // Add click listeners to items
        listContainer.querySelectorAll('.lib-item').forEach(el => {
            // Single Click: Preview
            el.addEventListener('click', () => {
                const id = el.getAttribute('data-id')
                if (id) store.setPreviewItem(id)
            })

            // Hover Actions - Edit
            const editBtn = el.querySelector('.action-edit')
            editBtn?.addEventListener('click', (e) => {
                e.stopPropagation()
                const id = el.getAttribute('data-id')
                const item = store.library.find(i => i.id === id)
                if (!item) return

                if (item.type === 'song') openSongEditor(item as any)
                // TODO: Add other editors as they become available
            })

            // Hover Actions - Add
            const addBtn = el.querySelector('.action-add')
            addBtn?.addEventListener('click', (e) => {
                e.stopPropagation()
                const id = el.getAttribute('data-id')
                const item = store.library.find(i => i.id === id)
                if (!item) return

                if (item.type === 'song') {
                    this.showSongArrangementPopover(e as MouseEvent, item as SongItem)
                } else if (item.type === 'scripture') {
                    // For now, just add default. Future: Translation selector
                    window.dispatchEvent(new CustomEvent('add-to-schedule', { detail: item }))
                } else {
                    // Direct Add
                    window.dispatchEvent(new CustomEvent('add-to-schedule', { detail: item }))
                }
            })

            // Double Click: Add to Schedule
            el.addEventListener('dblclick', () => {
                const id = el.getAttribute('data-id')
                const item = store.library.find(i => i.id === id)
                if (item) {
                    // Dispatch custom event that SchedulePanel can listen for
                    // Or directly find SchedulePanel instance - for now, use a global event
                    window.dispatchEvent(new CustomEvent('add-to-schedule', { detail: item }))
                }
            })

            // Drag Start
            el.addEventListener('dragstart', (e: any) => {
                e.dataTransfer.setData('application/json', getDragData(el.getAttribute('data-id')!))
            })

            // Right Click Context Menu
            el.addEventListener('contextmenu', (e) => {
                const id = el.getAttribute('data-id')
                const item = store.library.find(i => i.id === id)
                if (!item) return

                const menuItems: any[] = []

                // Edit option (for songs)
                if (item.type === 'song') {
                    menuItems.push({
                        label: 'Edit Song',
                        icon: ICONS.edit,
                        action: () => openSongEditor(item as any)
                    })
                }

                // Add to Schedule
                menuItems.push({
                    label: 'Add to Schedule',
                    icon: ICONS.add,
                    action: () => {
                        window.dispatchEvent(new CustomEvent('add-to-schedule', { detail: item }))
                    }
                })

                // Preview
                menuItems.push({
                    label: 'Preview',
                    icon: ICONS.eye,
                    action: () => store.setPreviewItem(item.id)
                })

                menuItems.push({ divider: true })

                // Delete
                menuItems.push({
                    label: 'Delete',
                    icon: ICONS.trash,
                    danger: true,
                    action: () => {
                        openConfirmModal({
                            title: 'Delete Item',
                            message: `Are you sure you want to delete "${item.title}" ? This action cannot be undone.`,
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
                })

                openContextMenu(e as MouseEvent, menuItems)
            })
        })
    }

    renderItem(item: LibraryItem) {
        const metadata = this.getItemMetadata(item)
        const thumbnail = this.getItemThumbnail(item)

        let icon: string = ICONS.file
        switch (item.type) {
            case 'song': icon = ICONS.music; break
            case 'scripture': icon = ICONS.book; break
            case 'video': icon = ICONS.video; break
            case 'image': icon = ICONS.image; break
            case 'presentation': icon = ICONS.slides; break
            case 'audio': icon = ICONS.music; break
        }

        return `
            <div class="lib-item group relative flex items-stretch h-11 w-full bg-gray-900 border-b border-gray-800 hover:bg-gray-800 cursor-pointer select-none overflow-hidden transition-colors" draggable="true" data-id="${item.id}">
                
                <!-- 1. Media Type Icon (Leftmost) -->
                <div class="w-10 flex items-center justify-center text-gray-500 bg-gray-900/30 shrink-0 border-r border-gray-800/50">
                    <div class="w-4 h-4">${icon}</div>
                </div>

                <!-- 2. Thumbnail (Flush, 16:9) -->
                <div class="h-full aspect-video relative bg-black shrink-0 border-r border-gray-800">
                    ${thumbnail
                ? `<img src="${thumbnail}" class="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity">`
                : `<div class="w-full h-full flex items-center justify-center bg-gray-800 text-gray-600 scale-75 opacity-50"><span class="scale-75">${icon}</span></div>`
            }
                </div>

                <!-- 3. Info (Title and Context) -->
                <div class="flex-1 min-w-0 flex flex-col justify-center px-4 relative z-0">
                    <div class="text-sm font-bold text-gray-200 truncate group-hover:text-white leading-tight mb-0.5 pr-20 transition-[padding] duration-200 ease-out group-hover:pr-24">
                        ${item.title}
                    </div>
                    <div class="text-xs text-gray-500 truncate font-medium flex items-center gap-2 pr-20 transition-[padding] duration-200 ease-out group-hover:pr-24">
                        ${metadata}
                    </div>
                </div>

                <!-- 4. Hover Actions (Flush, Square, Animated) -->
                <div class="absolute right-0 top-0 bottom-0 flex transform translate-x-full group-hover:translate-x-0 transition-transform duration-200 ease-out z-10 shadow-[-4px_0_10px_rgba(0,0,0,0.3)] bg-gray-800/0">
                    
                    <button class="action-edit h-full aspect-square flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white border-l border-gray-600 transition-colors" title="Edit">
                        <span class="w-5 h-5">${ICONS.edit}</span>
                    </button>
                    
                    <button class="action-add h-full aspect-square flex items-center justify-center bg-gray-700 hover:bg-blue-600 text-gray-300 hover:text-white border-l border-gray-600 transition-colors" title="Add to Schedule">
                        <span class="w-6 h-6 font-bold">+</span>
                    </button>
                </div>

            </div>
        `
    }

    getItemThumbnail(item: LibraryItem): string | null {
        if (item.type === 'image' || item.type === 'video') {
            const media = item as VideoItem | ImageItem
            // If local file path, we might need a way to serve it. 
            // For now assuming source_url is accessible or we have a thumbnail_path
            if ('thumbnail_path' in media && media.thumbnail_path) return media.thumbnail_path
            // Checking if source_url is an image we can verify
            if (item.type === 'image') return media.source_url
            return null
        }

        if (item.type === 'song') {
            const song = item as SongItem
            if (song.default_background_id) {
                const bg = store.library.find(i => i.id === song.default_background_id)
                if (bg && (bg.type === 'image' || bg.type === 'video')) {
                    return this.getItemThumbnail(bg)
                }
            }
        }

        return null
    }

    getItemMetadata(item: LibraryItem): string {
        if (item.type === 'song') {
            const song = item as SongItem
            const arrCount = song.arrangements?.length || 0
            const arrText = arrCount === 1 ? '1 Arrangement' : `${arrCount} Arrangements`
            return `${song.artist} • ${arrText}`
        }
        if (item.type === 'scripture') {
            const scrip = item as ScriptureItem
            const count = scrip.slides?.length || 0
            const verseText = count === 1 ? '1 Verse' : `${count} Verses`
            return verseText
        }
        if (item.type === 'presentation') {
            const pres = item as PresentationItem
            const count = pres.slides?.length || 0
            const slideText = count === 1 ? '1 slide' : `${count} slides`
            return `${pres.presentation_type.toUpperCase()} • ${slideText}`
        }
        if (item.type === 'video') {
            const vid = item as VideoItem
            // Duration | Start - End
            const total = this.formatTime(vid.duration_total || 0)
            const start = this.formatTime(vid.trim_start || 0)
            const end = this.formatTime(vid.trim_end || vid.duration_total || 0)
            return `${total} | ${start} - ${end}`
        }
        if (item.type === 'audio') {
            const aud = item as AudioItem
            // Audio currently has no trim support in types, so just showing duration
            return this.formatTime(aud.duration || 0)
        }
        if (item.type === 'image') {
            const img = item as ImageItem
            // Show original filename.
            // Assuming source_url is a path.
            if (!img.source_url) return 'Image'
            try {
                // Handle both URL and File Path styles
                const parts = img.source_url.split(/[/\\]/)
                const filename = parts.pop()
                return filename || 'Image'
            } catch {
                return 'Image'
            }
        }

        return item.subtitle || ''
    }

    formatTime(seconds: number): string {
        const m = Math.floor(seconds / 60)
        const s = Math.floor(seconds % 60)
        return `${m}:${s.toString().padStart(2, '0')}`
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

    // Simple fuzzy matching: returns score based on consecutive character matches
    fuzzyMatch(query: string, item: LibraryItem): number {
        const searchFields = [
            item.title.toLowerCase(),
            (item.subtitle || '').toLowerCase(),
            // Include lyrics for songs
            ((item as any).parts || []).map((p: any) => p.lyrics || '').join(' ').toLowerCase()
        ].join(' ')

        const q = query.toLowerCase()

        // Exact substring match: highest score
        if (searchFields.includes(q)) {
            return 100
        }

        // Fuzzy character-by-character match
        let score = 0
        let queryIndex = 0
        let consecutiveBonus = 0

        for (let i = 0; i < searchFields.length && queryIndex < q.length; i++) {
            if (searchFields[i] === q[queryIndex]) {
                score += 1 + consecutiveBonus
                consecutiveBonus += 1 // Reward consecutive matches
                queryIndex++
            } else {
                consecutiveBonus = 0
            }
        }

        // Did we match all query characters?
        if (queryIndex === q.length) {
            return score
        }
        return 0
    }
}

// Helper to get item from store (not efficient but checking id)
function getDragData(id: string) {
    const item = store.library.find(i => i.id === id)
    return JSON.stringify(item)
}
