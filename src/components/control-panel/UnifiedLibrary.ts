
import { ICONS } from '../../constants'
import { openSongEditor } from '../modals'
import { searchLibrary, fetchLibrary, uploadFile, addYouTubeLink } from '../../services/api'
import { addItemToSchedule } from '../../actions' // We might need to make sure this works with ProjectableItem
import type { ProjectableItem, MediaType } from '../../types'

let libraryItems: ProjectableItem[] = []
let selectedFilters: Set<string> = new Set(['all'])
let searchQuery = ''

// Creation Menu State
let creationMenuOpen = false
// Stack of menu items to represent current view (empty = root)

interface MenuItem {
    label: string
    icon?: string
    action?: string
    children?: MenuItem[]
}

// Menu Structure Definition
type MenuNode =
    | { type: 'action', label: string, action: string, icon?: string }
    | { type: 'group', label: string, children: MenuNode[], icon?: string }

const CREATION_MENU_STRUCTURE: MenuNode[] = [
    {
        type: 'group',
        label: 'Song',
        children: [
            { type: 'action', label: 'Create Song', action: 'create_song', icon: 'music' }
        ]
    },
    {
        type: 'group',
        label: 'Audio',
        children: [
            { type: 'action', label: 'Upload Audio File', action: 'upload_audio_file', icon: 'sound' }
        ]
    },
    {
        type: 'group',
        label: 'Video',
        children: [
            { type: 'action', label: 'Video Content File', action: 'upload_video_file', icon: 'video' },
            { type: 'action', label: 'YouTube URL', action: 'upload_youtube', icon: 'link' },
            { type: 'action', label: 'Background Video', action: 'upload_bg_video', icon: 'video' }
        ]
    },
    {
        type: 'group',
        label: 'Images',
        children: [
            { type: 'action', label: 'Image Content', action: 'upload_image_file', icon: 'image' },
            { type: 'action', label: 'Background Image', action: 'upload_bg_image', icon: 'image' }
        ]
    },
    {
        type: 'group',
        label: 'Presentations',
        children: [
            { type: 'action', label: 'Create Slide Deck', action: 'create_slide_deck', icon: 'slides' },
            { type: 'action', label: 'Upload Images as Presentation', action: 'upload_presentation_images', icon: 'images' },
            { type: 'action', label: 'Canva Export', action: 'upload_canva', icon: 'palette' }
        ]
    },
    {
        type: 'group',
        label: 'Bible',
        children: [
            { type: 'action', label: 'Upload Translation', action: 'upload_bible', icon: 'book' }
        ]
    }
]

function renderCreationPopover(): string {
    if (!creationMenuOpen) return ''

    // Helper to render a Top Level Group
    const renderGroup = (group: MenuNode, isLast: boolean): string => {
        if (group.type !== 'group' || !group.children) return ''

        return `
            <div class="px-0">
                <div class="px-3 py-1 text-xs font-bold text-text-muted uppercase tracking-wider mb-1 mt-1">${group.label}</div>
                ${group.children.map(item => {
            const iconName = item.icon as keyof typeof ICONS
            const iconSvg = iconName && ICONS[iconName] ? ICONS[iconName] : ICONS.file

            if (item.type !== 'action') return ''

            return `
                    <div class="px-3 py-2 flex items-center gap-3 hover:bg-accent-primary hover:text-white cursor-pointer group transition-colors text-sm text-text-primary creation-menu-item" data-action="${item.action}">
                         <span class="w-4 h-4 opacity-70 group-hover:opacity-100">${iconSvg}</span>
                         <span>${item.label}</span>
                    </div>
                    `
        }).join('')}
            </div>
            ${!isLast ? '<div class="h-px bg-border-color mx-2 my-1"></div>' : ''}
        `
    }

    return `
        <div class="fixed z-[9999] bg-bg-secondary border border-border-color shadow-2xl rounded-sm flex flex-col creation-popover overflow-hidden animate-fade-in-down w-64" style="display: none;">
            <div class="py-2 flex flex-col max-h-[80vh] overflow-y-auto">
                ${CREATION_MENU_STRUCTURE.map((node, i) => renderGroup(node, i === CREATION_MENU_STRUCTURE.length - 1)).join('')}
            </div>
        </div>
    `
}

// --- Render Helpers ---

function renderChipsHTML(): string {
    const chipClass = "flex-1 py-1.5 text-[0.7rem] font-medium cursor-pointer transition-colors border-r border-border-color last:border-r-0 whitespace-nowrap select-none flex items-center justify-center uppercase tracking-wide"
    const chipActiveClass = "bg-accent-primary text-white"
    const chipInactiveClass = "bg-bg-secondary text-text-secondary hover:bg-bg-hover hover:text-text-primary"

    const filters: { id: MediaType | 'all', label: string }[] = [
        { id: 'all', label: 'All' },
        { id: 'song', label: 'Song' },
        { id: 'audio', label: 'Audio' },
        { id: 'video', label: 'Video' },
        { id: 'image', label: 'Image' },
        { id: 'slide', label: 'Slide' },
        { id: 'scripture', label: 'Bible' }
    ]

    return filters.map(f => `
    <div class="library-filter-chip ${chipClass} ${selectedFilters.has(f.id) ? chipActiveClass : chipInactiveClass}" data-filter="${f.id}">
        ${f.label}
    </div>
  `).join('')
}

function renderListHTML(): string {
    const emptyClass = "flex flex-col items-center justify-center p-8 text-text-muted text-sm gap-2 opacity-60"
    const itemClass = "group flex items-center justify-between px-3 py-2 hover:bg-bg-hover cursor-grab border-b border-border-color/50 transition-colors duration-150"
    const titleClass = "font-medium text-sm text-text-primary whitespace-nowrap overflow-hidden text-ellipsis"
    const subTitleClass = "text-xs text-text-muted whitespace-nowrap overflow-hidden text-ellipsis"
    const iconClass = "w-8 h-8 flex items-center justify-center bg-bg-tertiary rounded-sm mr-3 shrink-0 text-lg"

    const filtered = getFilteredItems()

    if (filtered.length === 0) {
        if (searchQuery) {
            return `<div class="${emptyClass}">
                <span class="w-8 h-8 opacity-50 text-text-muted">${ICONS.search}</span>
                <span>No results for "${searchQuery}"</span>
            </div>`
        } else {
            return `<div class="${emptyClass}">
                <span class="w-8 h-8 opacity-50 text-text-muted">${ICONS.media}</span>
                <span>Library is empty</span>
            </div>`
        }
    }

    return filtered.map((item, index) => {
        let icon: string = ICONS.file
        // Rich Content Resolution
        let metaBadges = ''

        if (item.type === 'song') {
            icon = ICONS.music
            // Song Arrangements
            const variations = item.data?.variations || []
            if (variations.length > 0) {
                // Determine parts from first variation or "Default"
                const parts: string[] = variations[0].arrangement || []
                if (parts.length > 0) {
                    // Render first 6 parts as pills
                    const preview = parts.slice(0, 6).map(p => {
                        // Mappings for short names
                        const map: Record<string, string> = { 'Verse 1': 'V1', 'Verse 2': 'V2', 'Chorus': 'C', 'Bridge': 'B' }
                        // Simple heuristic to shorten names
                        let label = map[p] || p.substring(0, 2).toUpperCase()
                        // If numeric badge (e.g. Verse 1 -> V1) handling
                        if (p.startsWith('Verse ')) label = 'V' + p.replace('Verse ', '')
                        if (p === 'Chorus') label = 'C'
                        if (p === 'Bridge') label = 'B'

                        return `<span class="px-1 text-[9px] bg-bg-tertiary rounded text-text-secondary border border-border-color">${label}</span>`
                    }).join('')
                    metaBadges = `<div class="flex items-center gap-1 mt-0.5 opacity-80">${preview}${parts.length > 6 ? '<span class="text-[9px] text-text-muted">...</span>' : ''}</div>`
                }
            }
        }

        if (item.type === 'video') {
            icon = item.thumbnail ? `<img src="${item.thumbnail}" class="w-full h-full object-cover rounded-sm"/>` : ICONS.video
            if (item.data?.size) {
                metaBadges = `<span class="text-[10px] text-text-muted bg-bg-tertiary px-1 rounded border border-border-color">${item.data.size}</span>`
            }
        }

        if (item.type === 'image') {
            icon = item.thumbnail ? `<img src="${item.thumbnail}" class="w-full h-full object-cover rounded-sm"/>` : ICONS.image
            if (item.data?.size) {
                metaBadges = `<span class="text-[10px] text-text-muted bg-bg-tertiary px-1 rounded border border-border-color">${item.data.size}</span>`
            }
        }

        if (item.type === 'scripture') icon = ICONS.book

        if (item.type === 'slide') {
            icon = ICONS.slides
            // Slide count
            const count = item.data?.slides?.length || 0
            if (count) {
                metaBadges = `<span class="text-[10px] text-text-muted bg-bg-tertiary px-1 rounded border border-border-color">${count} slides</span>`
            }
        }

        if (item.type === 'audio') {
            icon = ICONS.sound
            if (item.data?.size) {
                metaBadges = `<span class="text-[10px] text-text-muted bg-bg-tertiary px-1 rounded border border-border-color">${item.data.size}</span>`
            }
        }

        return `
            <div class="library-item ${itemClass}" draggable="true" data-type="${item.type}" data-id="${item.id}" data-index="${index}">
                <div class="flex items-center flex-1 min-w-0">
                    <div class="${iconClass} text-text-secondary select-none pointer-events-none">${icon}</div>
                    <div class="flex flex-col min-w-0 flex-1">
                        <div class="${titleClass}">${item.title}</div>
                        ${metaBadges ? metaBadges : `<div class="${subTitleClass}">${item.subtitle || item.type.toUpperCase()}</div>`}
                    </div>
                </div>
                <div class="opacity-0 group-hover:opacity-100 transition-opacity">
                    <button class="add-btn icon-btn-sm w-6 h-6 rounded bg-bg-tertiary hover:bg-accent-primary hover:text-white flex items-center justify-center p-0" title="Add to Schedule">
                        ${ICONS.plus}
                    </button>
                </div>
            </div>
          `
    }).join('')
}

// --- Main Render ---

export function renderUnifiedLibrary(): string {
    const containerClass = "flex flex-col h-full bg-bg-primary"
    const searchSectionClass = "shrink-0 flex flex-col bg-bg-secondary"

    // Top Row: Search + Add Button
    const topRowClass = "flex items-stretch h-[36px] border-b border-border-color bg-bg-primary"

    // Search
    const searchWrapperClass = "relative flex-1 group"
    const searchInputClass = "w-full h-full bg-transparent border-none pl-9 pr-2 text-sm text-text-primary focus:outline-none placeholder:text-text-muted/70"
    const searchIconClass = "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted opacity-50 pointer-events-none"

    // Add Button
    const addButtonClass = "w-[36px] flex items-center justify-center border-l border-border-color hover:bg-bg-hover hover:text-white text-text-muted cursor-pointer creation-menu-trigger transition-colors bg-bg-secondary"

    const filterSectionClass = "flex items-center w-full border-b border-border-color"
    const listWrapperClass = "flex-1 overflow-y-auto min-h-0 bg-bg-primary"
    const listClass = "flex flex-col"

    return `
    <div class="${containerClass}">
        <input type="file" id="library-upload-input" style="display:none;" />
        <div class="${searchSectionClass}">
            <div class="${topRowClass}">
                <div class="${searchWrapperClass} search-wrapper-el">
                    <input type="text" class="${searchInputClass} library-search-input" placeholder="Search..." value="${searchQuery}" />
                    <span class="${searchIconClass}">${ICONS.search}</span>
                </div>
                <div class="creation-popover-container">
                    ${renderCreationPopover()}
                </div>
                <button class="${addButtonClass}" title="Create / Upload">
                    <span class="w-4 h-4">${ICONS.plus}</span>
                </button>
            </div>
            <div class="${filterSectionClass} filter-chips-container">
                ${renderChipsHTML()}
            </div>
        </div>
        <div class="${listWrapperClass}">
            <div class="${listClass}" id="unified-library-list">
                ${renderListHTML()}
            </div>
        </div>
    </div>
  `
}

// --- DOM Updaters ---

function updateListDOM() {
    const listContainer = document.querySelector('#unified-library-list')
    if (listContainer) {
        listContainer.innerHTML = renderListHTML()
        attachListListeners(listContainer as HTMLElement)
    }
}

function updatePopoverDOM() {
    let container = document.querySelector('.creation-popover-container')
    const trigger = document.querySelector('.creation-menu-trigger')

    if (container && trigger) {
        container.innerHTML = renderCreationPopover()

        const popover = container.querySelector('.creation-popover') as HTMLElement
        if (popover) {
            // Must be visible to measure
            popover.style.display = 'flex'
            popover.style.visibility = 'hidden' // Hide while measuring

            const popRect = popover.getBoundingClientRect()
            const triggerRect = trigger.getBoundingClientRect()
            const viewportWidth = window.innerWidth
            const viewportHeight = window.innerHeight

            // Preferred Position: Right of trigger, Top aligned
            let top = triggerRect.top
            let left = triggerRect.right + 10

            // Horizontal Check: If overlaps right edge, flip to left
            if (left + popRect.width > viewportWidth - 10) {
                left = triggerRect.left - popRect.width - 10
            }

            // Vertical Check: If overlaps bottom edge, shift up
            if (top + popRect.height > viewportHeight - 10) {
                top = viewportHeight - popRect.height - 10
            }

            // Safety: Ensure it doesn't go off top/left
            if (top < 10) top = 10
            if (left < 10) left = 10

            popover.style.top = `${top}px`
            popover.style.left = `${left}px`
            popover.style.visibility = 'visible' // Show

            attachPopoverListeners(container as HTMLElement)
        }
    }
}

function updateChipsDOM() {
    const container = document.querySelector('.filter-chips-container')
    if (container) {
        container.innerHTML = renderChipsHTML()
        attachChipListeners(container as HTMLElement)
    }
}

// --- Listeners ---

export function initUnifiedLibraryListeners(): void {
    const container = document.querySelector('.library-wrapper')
    if (!container) return

    // Search Input (Only attach once per full render)
    const searchInput = container.querySelector('.library-search-input') as HTMLInputElement
    // Only fetch if empty
    if (libraryItems.length === 0 && !searchQuery) {
        fetchLibrary().then(items => {
            libraryItems = items
            updateListDOM()
        })
    }

    let debounceTimer: ReturnType<typeof setTimeout>
    searchInput?.addEventListener('input', (e) => {
        const val = (e.target as HTMLInputElement).value
        searchQuery = val

        clearTimeout(debounceTimer)
        debounceTimer = setTimeout(() => {
            if (val.trim()) {
                searchLibrary(val).then(items => {
                    libraryItems = items
                    updateListDOM()
                })
            } else {
                fetchLibrary().then(items => {
                    libraryItems = items
                    updateListDOM()
                })
            }
        }, 300)
    })

    // Attach initial listeners
    const chipsContainer = container.querySelector('.filter-chips-container') as HTMLElement
    if (chipsContainer) attachChipListeners(chipsContainer)

    const listContainer = container.querySelector('#unified-library-list') as HTMLElement
    if (listContainer) attachListListeners(listContainer)

    // Trigger Button (attach once)
    const triggerBtn = container.querySelector('.creation-menu-trigger')
    triggerBtn?.addEventListener('click', (e) => {
        e.stopPropagation()
        creationMenuOpen = !creationMenuOpen
        updatePopoverDOM()

        // Handle global close
        if (creationMenuOpen) {
            // Defer to avoid immediate close
            setTimeout(() => {
                const closeHandler = (ev: Event) => {
                    const target = ev.target as HTMLElement
                    if (!target.closest('.creation-popover') && !target.closest('.creation-menu-trigger')) {
                        creationMenuOpen = false
                        updatePopoverDOM()
                        document.removeEventListener('click', closeHandler)
                    }
                }
                document.addEventListener('click', closeHandler)
            }, 0)
        }
    })

    // Upload Input Listener
    const uploadInput = container.querySelector('#library-upload-input') as HTMLInputElement
    uploadInput?.addEventListener('change', async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (file && pendingUploadType) {
            const result = await uploadFile(file, pendingUploadType)
            if (result?.success) {
                // Refresh
                const items = await fetchLibrary()
                libraryItems = items
                updateListDOM()
                // alert(`Uploaded ${file.name} successfully`)
            } else {
                alert('Upload failed')
            }
        }
    })
}

function attachChipListeners(container: HTMLElement) {
    container.querySelectorAll('.library-filter-chip').forEach(chip => {
        chip.addEventListener('click', (e) => {
            const filter = (e.currentTarget as HTMLElement).getAttribute('data-filter') as string

            if (filter === 'all') {
                selectedFilters.clear()
                selectedFilters.add('all')
            } else {
                if (selectedFilters.has('all')) selectedFilters.delete('all')

                if (selectedFilters.has(filter)) {
                    selectedFilters.delete(filter)
                } else {
                    selectedFilters.add(filter)
                }

                if (selectedFilters.size === 0) selectedFilters.add('all')
            }

            updateChipsDOM()
            updateListDOM()
        })
    })
}

function attachListListeners(container: HTMLElement) {
    container.querySelectorAll('.library-item').forEach(itemEl => {
        itemEl.addEventListener('dragstart', (e) => {
            const event = e as DragEvent
            const index = parseInt(itemEl.getAttribute('data-index') || '0')
            const filtered = getFilteredItems()
            const item = filtered[index]

            if (item) {
                const payload = JSON.stringify(item)
                event.dataTransfer?.setData('application/json', payload)
                event.dataTransfer!.effectAllowed = 'copy'
            }
        })

        itemEl.querySelector('.add-btn')?.addEventListener('click', () => {
            const index = parseInt(itemEl.getAttribute('data-index') || '0')
            const filtered = getFilteredItems()
            const item = filtered[index]
            if (item) {
                const scheduleItem = { ...item }
                // @ts-ignore
                addItemToSchedule(scheduleItem)
            }
        })
    })
}

// --- Action Handling ---
let pendingUploadType: string | null = null

function triggerUpload(accept: string, targetType: string) {
    const input = document.getElementById('library-upload-input') as HTMLInputElement
    if (input) {
        input.accept = accept
        pendingUploadType = targetType
        input.value = '' // Reset
        input.click()
    }
}

async function handleAction(action: string) {
    if (action === 'create_song') {
        openSongEditor(undefined, async () => {
            // Refresh library after song creation
            const items = await fetchLibrary()
            libraryItems = items
            updateListDOM()
        })
        return
    }

    // Imported addYouTubeLink first
    // ...

    // YouTube
    if (action === 'upload_youtube') {
        const url = prompt('Enter YouTube URL:')
        if (url) {
            // Optimistically update or show loading?
            // For now simple block
            addYouTubeLink(url).then(res => {
                if (res?.success) {
                    fetchLibrary().then(items => {
                        libraryItems = items
                        updateListDOM()
                    })
                } else {
                    alert('Failed to add YouTube video. Please check the URL.')
                }
            })
        }
        return
    }

    // Upload Actions
    if (action === 'upload_audio_file') return triggerUpload('audio/*', 'audio')
    if (action === 'upload_video_file') return triggerUpload('video/*', 'video_content')
    if (action === 'upload_bg_video') return triggerUpload('video/*', 'video_bg')
    if (action === 'upload_image_file') return triggerUpload('image/*', 'image_content')
    if (action === 'upload_bg_image') return triggerUpload('image/*', 'image_bg')
    if (action === 'upload_presentation_images') return triggerUpload('image/*', 'image_slides') // Maps to slides/image_slides logic (needs server support, use simple img for now)

    // Future / Placeholders
    if (['upload_youtube', 'create_slide_deck', 'upload_canva', 'upload_bible'].includes(action)) {
        alert(`Feature "${action.replace(/_/g, ' ')}" is coming soon!`)
    }
}

function attachPopoverListeners(container: HTMLElement) {
    // Menu Items (Flat List)
    container.querySelectorAll('.creation-menu-item').forEach(itemEl => {
        itemEl.addEventListener('click', (e) => {
            e.stopPropagation()
            const action = itemEl.getAttribute('data-action')

            if (action) {
                handleAction(action)
                creationMenuOpen = false
                updatePopoverDOM()
            }
        })
    })
}

function getFilteredItems() {
    return libraryItems.filter(item => {
        if (selectedFilters.has('all')) return true
        if (selectedFilters.has(item.type)) return true
        return false
    })
}
